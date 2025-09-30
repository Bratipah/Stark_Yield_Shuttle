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
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        let caller: ContractAddress = get_caller_address();
        self.owner.write(caller);
        self.total_btc.write(0_u128);
        // vault left unset
    }

    #[external(v0)]
    fn deposit_btc(ref self: ContractState, amount: u128) {
        // Accept bridged BTC (via Atomiq SDK wrapped asset)
        let current_total = self.total_btc.read();
        self.total_btc.write(current_total + amount);
        let user: ContractAddress = get_caller_address();
        let prev = self.user_balances.read(user);
        self.user_balances.write(user, prev + amount);
        // TODO: Call yield protocol contract e.g. Vesu/Troves
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
    }

    // Events
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Deposited: Deposited,
        Withdrawn: Withdrawn,
    }

    #[derive(Drop, starknet::Event)]
    struct Deposited { user: ContractAddress, amount: u128 }

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
        self.emit(Deposited { user: user, amount: amount });
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
}
