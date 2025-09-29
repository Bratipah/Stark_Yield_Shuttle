#[starknet::contract]
mod ShuttleContract {
    use starknet::ContractAddress;
    use starknet::get_caller_address;

    #[storage]
    struct Storage {
        total_btc: felt252,
        owner: ContractAddress,
        // map user -> balance
        user_balances: LegacyMap::<ContractAddress, felt252>,
        // optional: yield vault address placeholder
        vault: ContractAddress,
    }

    #[constructor]
    fn constructor() {
        let caller: ContractAddress = get_caller_address();
        owner::write(caller);
        total_btc::write(0);
        vault::write(ContractAddress::from(0));
    }

    #[external]
    fn deposit_btc(amount: felt252) {
        // Accept bridged BTC (via Atomiq SDK wrapped asset)
        let current_total = total_btc::read();
        total_btc::write(current_total + amount);
        let user: ContractAddress = get_caller_address();
        let prev = user_balances::read(user);
        user_balances::write(user, prev + amount);
        // TODO: Call yield protocol contract e.g. Vesu/Troves
    }

    #[external]
    fn auto_invest() {
        // TODO: deposit into chosen yield vault
    }

    #[external]
    fn withdraw_btc(amount: felt252) {
        // Withdraw from yield protocol and return BTC
        let user: ContractAddress = get_caller_address();
        let prev = user_balances::read(user);
        assert(prev >= amount, 'INSUFFICIENT_BAL');
        user_balances::write(user, prev - amount);
        let current_total = total_btc::read();
        total_btc::write(current_total - amount);
    }

    #[event]
    fn Deposited { user: ContractAddress, amount: felt252 }

    #[event]
    fn Withdrawn { user: ContractAddress, amount: felt252 }

    #[external]
    fn deposit_for(user: ContractAddress, amount: felt252) {
        let caller: ContractAddress = get_caller_address();
        let owner_addr = owner::read();
        assert(caller == owner_addr, 'ONLY_OWNER');
        let current_total = total_btc::read();
        total_btc::write(current_total + amount);
        let prev = user_balances::read(user);
        user_balances::write(user, prev + amount);
        emit Deposited { user: user, amount: amount };
    }

    #[external]
    fn withdraw_for(user: ContractAddress, amount: felt252) {
        let caller: ContractAddress = get_caller_address();
        let owner_addr = owner::read();
        assert(caller == owner_addr, 'ONLY_OWNER');
        let prev = user_balances::read(user);
        assert(prev >= amount, 'INSUFFICIENT_BAL');
        user_balances::write(user, prev - amount);
        let current_total = total_btc::read();
        total_btc::write(current_total - amount);
        emit Withdrawn { user: user, amount: amount };
    }

    #[view]
    fn balance() -> felt252 {
        total_btc::read()
    }

    #[view]
    fn get_balance(user: ContractAddress) -> felt252 {
        user_balances::read(user)
    }
}
