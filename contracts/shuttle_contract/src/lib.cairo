#[starknet::contract]
mod ShuttleContract {
    use starknet::ContractAddress;
    use starknet::get_caller_address;

    #[storage]
    struct Storage {
        total_btc: u128,
        owner: ContractAddress,
        // map user -> balance
        user_balances: LegacyMap::<ContractAddress, u128>,
        // optional: yield vault address placeholder
        vault: ContractAddress,
        // protocol fee config (in basis points, 1 bps = 0.01%)
        fee_bps: u16,
        fee_recipient: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner_param: ContractAddress) {
        self.owner.write(owner_param);
        self.total_btc.write(0_u128);
        // vault left unset
        // default fee: 0 bps, recipient = owner
        self.fee_bps.write(0_u16);
        self.fee_recipient.write(owner_param);
    }

    #[external(v0)]
    fn deposit_btc(ref self: ContractState, amount: u128) {
        // Accept bridged BTC (via Atomiq SDK wrapped asset)
        // apply protocol fee
        let bps: u16 = self.fee_bps.read();
        let bps_u128: u128 = bps.into();
        let fee: u128 = (amount * bps_u128) / 10000_u128;
        let credited: u128 = amount - fee;

        let current_total = self.total_btc.read();
        self.total_btc.write(current_total + credited);
        let user: ContractAddress = get_caller_address();
        let prev = self.user_balances.read(user);
        self.user_balances.write(user, prev + credited);
        // TODO: Call yield protocol contract e.g. Vesu/Troves
        self.emit(Deposited { user: user, amount: credited, fee_paid: fee });
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
        self.emit(Withdrawn { user: user, amount: amount });
    }

    // Events
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Deposited: Deposited,
        Withdrawn: Withdrawn,
    }

    #[derive(Drop, starknet::Event)]
    struct Deposited { user: ContractAddress, amount: u128, fee_paid: u128 }

    #[derive(Drop, starknet::Event)]
    struct Withdrawn { user: ContractAddress, amount: u128 }

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
        self.emit(Deposited { user: user, amount: amount, fee_paid: 0_u128 });
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
        self.emit(Withdrawn { user: user, amount: amount });
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
}
