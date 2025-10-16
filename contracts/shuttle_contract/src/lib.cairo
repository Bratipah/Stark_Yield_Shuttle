#[starknet::contract]
mod ShuttleContract {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::get_contract_address;
    use core::integer::u256;

    #[storage]
    struct Storage {
        total_btc: u128,
        total_wbtc: u128,
        total_usdt: u128,
        owner: ContractAddress,
        // map user -> balance
        user_balances: LegacyMap::<ContractAddress, u128>,
        user_balances_wbtc: LegacyMap::<ContractAddress, u128>,
        user_balances_usdt: LegacyMap::<ContractAddress, u128>,
        // optional: yield vault address placeholder
        vault: ContractAddress,
        // protocol fee config (in basis points, 1 bps = 0.01%)
        fee_bps: u16,
        fee_recipient: ContractAddress,
        // accumulated protocol fees (accounting balance)
        accumulated_fees: u128,
        // ERC20 USDT token address
        usdt_token: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner_param: ContractAddress) {
        self.owner.write(owner_param);
        self.total_btc.write(0_u128);
        self.total_wbtc.write(0_u128);
        self.total_usdt.write(0_u128);
        // vault left unset
        // default fee: 0 bps, recipient = owner
        self.fee_bps.write(0_u16);
        self.fee_recipient.write(owner_param);
        self.accumulated_fees.write(0_u128);
    }

    #[external(v0)]
    fn deposit_btc(ref self: ContractState, amount: u128) {
        // Accept bridged BTC (via Atomiq SDK wrapped asset)
        // apply protocol fee
        let bps: u16 = self.fee_bps.read();
        let bps_u128: u128 = bps.into();
        let fee: u128 = (amount * bps_u128) / 10000_u128;
        let credited: u128 = amount - fee;
        // account for accrued fees
        let cur_fees = self.accumulated_fees.read();
        self.accumulated_fees.write(cur_fees + fee);

        let current_total = self.total_btc.read();
        self.total_btc.write(current_total + credited);
        let user: ContractAddress = get_caller_address();
        let prev = self.user_balances.read(user);
        self.user_balances.write(user, prev + credited);
        // TODO: Call yield protocol contract e.g. Vesu/Troves
        self.emit(Deposited { user: user, amount: credited, fee_paid: fee, asset: 0_u8 });
    }

    #[external(v0)]
    fn auto_invest(ref self: ContractState) {
        // TODO: deposit into chosen yield vault
    }

    #[external(v0)]
    fn withdraw_btc(ref self: ContractState, amount: u128) {
        // Withdraw from yield protocol and return BTC
        let user: ContractAddress = get_caller_address();
        let prev = self.user_balances.read(user);
        if (prev < amount) {
            panic_with_felt252('INSUFFICIENT_BAL');
        }
        self.user_balances.write(user, prev - amount);
        let current_total = self.total_btc.read();
        self.total_btc.write(current_total - amount);
        self.emit(Withdrawn { user: user, amount: amount, asset: 0_u8 });
    }

    // Events
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Deposited: Deposited,
        Withdrawn: Withdrawn,
        FeesSwept: FeesSwept,
    }

    #[derive(Drop, starknet::Event)]
    struct Deposited { user: ContractAddress, amount: u128, fee_paid: u128, asset: u8 }

    #[derive(Drop, starknet::Event)]
    struct Withdrawn { user: ContractAddress, amount: u128, asset: u8 }

    #[derive(Drop, starknet::Event)]
    struct FeesSwept { amount: u128 }

    #[external(v0)]
    fn deposit_for(ref self: ContractState, user: ContractAddress, amount: u128) {
        let caller: ContractAddress = get_caller_address();
        let owner_addr = self.owner.read();
        assert(caller == owner_addr, 'ONLY_OWNER');
        let current_total = self.total_btc.read();
        self.total_btc.write(current_total + amount);
        let prev = self.user_balances.read(user);
        self.user_balances.write(user, prev + amount);
        // owner flows do not charge protocol fee
        self.emit(Deposited { user: user, amount: amount, fee_paid: 0_u128, asset: 0_u8 });
    }

    #[external(v0)]
    fn withdraw_for(ref self: ContractState, user: ContractAddress, amount: u128) {
        let caller: ContractAddress = get_caller_address();
        let owner_addr = self.owner.read();
        assert(caller == owner_addr, 'ONLY_OWNER');
        let prev = self.user_balances.read(user);
        if (prev < amount) {
            panic_with_felt252('INSUFFICIENT_BAL');
        }
        self.user_balances.write(user, prev - amount);
        let current_total = self.total_btc.read();
        self.total_btc.write(current_total - amount);
        self.emit(Withdrawn { user: user, amount: amount, asset: 0_u8 });
    }

    #[external(v0)]
    fn balance(self: @ContractState) -> u128 {
        self.total_btc.read()
    }

    #[external(v0)]
    fn get_balance(self: @ContractState, user: ContractAddress) -> u128 {
        self.user_balances.read(user)
    }

    // Owner setter for protocol fee configuration
    #[external(v0)]
    fn set_fee(ref self: ContractState, bps: u16, recipient: ContractAddress) {
        let caller: ContractAddress = get_caller_address();
        let owner_addr = self.owner.read();
        assert(caller == owner_addr, 'ONLY_OWNER');
        self.fee_bps.write(bps);
        self.fee_recipient.write(recipient);
    }

    #[external(v0)]
    fn get_fees(self: @ContractState) -> u128 {
        self.accumulated_fees.read()
    }

    // Owner sweep of accounted protocol fees (accounting-only event)
    #[external(v0)]
    fn sweep_fees(ref self: ContractState, amount: u128) {
        let caller: ContractAddress = get_caller_address();
        let owner_addr = self.owner.read();
        assert(caller == owner_addr, 'ONLY_OWNER');
        let cur = self.accumulated_fees.read();
        if (cur < amount) {
            panic_with_felt252('INSUFFICIENT_FEES');
        }
        self.accumulated_fees.write(cur - amount);
        self.emit(FeesSwept { amount: amount });
    }

    // --- USDT ERC20 integration ---
    #[starknet::interface]
    trait IERC20<TContractState> {
        fn transfer_from(ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256);
        fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256);
    }

    // Dispatcher type is generated by the interface macro

    fn to_u256(amount: u128) -> u256 {
        u256 { low: amount, high: 0_u128 }
    }

    #[external(v0)]
    fn set_usdt_token(ref self: ContractState, token: ContractAddress) {
        let caller: ContractAddress = get_caller_address();
        let owner_addr = self.owner.read();
        assert(caller == owner_addr, 'ONLY_OWNER');
        self.usdt_token.write(token);
    }

    #[external(v0)]
    fn deposit_usdt(ref self: ContractState, amount: u128) {
        let user: ContractAddress = get_caller_address();
        let token = self.usdt_token.read();
        // Call transfer_from(user -> this)
        let me: ContractAddress = get_contract_address();
        let erc20 = IERC20Dispatcher { contract_address: token };
        erc20.transfer_from(user, me, to_u256(amount));

        let prev = self.user_balances_usdt.read(user);
        self.user_balances_usdt.write(user, prev + amount);
        let t = self.total_usdt.read();
        self.total_usdt.write(t + amount);
        self.emit(Deposited { user: user, amount: amount, fee_paid: 0_u128, asset: 2_u8 });
    }

    #[external(v0)]
    fn withdraw_usdt(ref self: ContractState, amount: u128) {
        let user: ContractAddress = get_caller_address();
        let token = self.usdt_token.read();
        let prev = self.user_balances_usdt.read(user);
        if (prev < amount) {
            panic_with_felt252('INSUFFICIENT_BAL');
        }
        self.user_balances_usdt.write(user, prev - amount);
        let t = self.total_usdt.read();
        self.total_usdt.write(t - amount);
        // transfer(this -> user)
        let erc20 = IERC20Dispatcher { contract_address: token };
        erc20.transfer(user, to_u256(amount));
        self.emit(Withdrawn { user: user, amount: amount, asset: 2_u8 });
    }

    #[external(v0)]
    fn deposit_for_usdt(ref self: ContractState, user: ContractAddress, amount: u128) {
        let caller: ContractAddress = get_caller_address();
        let owner_addr = self.owner.read();
        assert(caller == owner_addr, 'ONLY_OWNER');
        let prev = self.user_balances_usdt.read(user);
        self.user_balances_usdt.write(user, prev + amount);
        let t = self.total_usdt.read();
        self.total_usdt.write(t + amount);
        self.emit(Deposited { user: user, amount: amount, fee_paid: 0_u128, asset: 2_u8 });
    }

    #[external(v0)]
    fn withdraw_for_usdt(ref self: ContractState, user: ContractAddress, amount: u128) {
        let caller: ContractAddress = get_caller_address();
        let owner_addr = self.owner.read();
        assert(caller == owner_addr, 'ONLY_OWNER');
        let prev = self.user_balances_usdt.read(user);
        if (prev < amount) {
            panic_with_felt252('INSUFFICIENT_BAL');
        }
        self.user_balances_usdt.write(user, prev - amount);
        let t = self.total_usdt.read();
        self.total_usdt.write(t - amount);
        self.emit(Withdrawn { user: user, amount: amount, asset: 2_u8 });
    }

    #[external(v0)]
    fn get_balance_usdt(self: @ContractState, user: ContractAddress) -> u128 {
        self.user_balances_usdt.read(user)
    }

    // --- WBTC variants ---
    #[external(v0)]
    fn deposit_wbtc(ref self: ContractState, amount: u128) {
        let bps: u16 = self.fee_bps.read();
        let bps_u128: u128 = bps.into();
        let fee: u128 = (amount * bps_u128) / 10000_u128;
        let credited: u128 = amount - fee;
        let cur_fees = self.accumulated_fees.read();
        self.accumulated_fees.write(cur_fees + fee);

        let current_total = self.total_wbtc.read();
        self.total_wbtc.write(current_total + credited);
        let user: ContractAddress = get_caller_address();
        let prev = self.user_balances_wbtc.read(user);
        self.user_balances_wbtc.write(user, prev + credited);
        self.emit(Deposited { user: user, amount: credited, fee_paid: fee, asset: 1_u8 });
    }

    #[external(v0)]
    fn withdraw_wbtc(ref self: ContractState, amount: u128) {
        let user: ContractAddress = get_caller_address();
        let prev = self.user_balances_wbtc.read(user);
        if (prev < amount) {
            panic_with_felt252('INSUFFICIENT_BAL');
        }
        self.user_balances_wbtc.write(user, prev - amount);
        let current_total = self.total_wbtc.read();
        self.total_wbtc.write(current_total - amount);
        self.emit(Withdrawn { user: user, amount: amount, asset: 1_u8 });
    }

    #[external(v0)]
    fn deposit_for_wbtc(ref self: ContractState, user: ContractAddress, amount: u128) {
        let caller: ContractAddress = get_caller_address();
        let owner_addr = self.owner.read();
        assert(caller == owner_addr, 'ONLY_OWNER');
        let current_total = self.total_wbtc.read();
        self.total_wbtc.write(current_total + amount);
        let prev = self.user_balances_wbtc.read(user);
        self.user_balances_wbtc.write(user, prev + amount);
        self.emit(Deposited { user: user, amount: amount, fee_paid: 0_u128, asset: 1_u8 });
    }

    #[external(v0)]
    fn withdraw_for_wbtc(ref self: ContractState, user: ContractAddress, amount: u128) {
        let caller: ContractAddress = get_caller_address();
        let owner_addr = self.owner.read();
        assert(caller == owner_addr, 'ONLY_OWNER');
        let prev = self.user_balances_wbtc.read(user);
        if (prev < amount) {
            panic_with_felt252('INSUFFICIENT_BAL');
        }
        self.user_balances_wbtc.write(user, prev - amount);
        let current_total = self.total_wbtc.read();
        self.total_wbtc.write(current_total - amount);
        self.emit(Withdrawn { user: user, amount: amount, asset: 1_u8 });
    }

    #[external(v0)]
    fn get_balance_wbtc(self: @ContractState, user: ContractAddress) -> u128 {
        self.user_balances_wbtc.read(user)
    }
}
