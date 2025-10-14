#[cfg(test)]
mod tests {
    use starknet::testing::set_caller_address;
    use starknet::ContractAddress;
    use super::super::ShuttleContract;

    #[test]
    fn deposit_and_withdraw_flow() {
        let user = ContractAddress::from(0x123);
        set_caller_address(user);

        // set owner to user for this test
        ShuttleContract::constructor(user);

        ShuttleContract::deposit_btc(1_u128); // 0.01 BTC in demo units
        let bal1 = ShuttleContract::get_balance(user);
        assert(bal1 == 1, 'balance after deposit');

        ShuttleContract::withdraw_btc(0_u128);
        let bal2 = ShuttleContract::get_balance(user);
        assert(bal2 == 1, 'balance unchanged when withdrawing zero');
    }

    #[test]
    fn owner_deposit_for_and_withdraw_for() {
        let owner = ContractAddress::from(0x1);
        let alice = ContractAddress::from(0xA);
        ShuttleContract::constructor(owner);

        ShuttleContract::deposit_for(alice, 5_u128);
        let bal = ShuttleContract::get_balance(alice);
        assert(bal == 5, 'deposit_for updates alice balance');

        ShuttleContract::withdraw_for(alice, 3_u128);
        let bal2 = ShuttleContract::get_balance(alice);
        assert(bal2 == 2, 'withdraw_for deducts correctly');
    }

    #[test]
    #[should_panic]
    fn non_owner_cannot_call_deposit_for() {
        let owner = ContractAddress::from(0x1);
        ShuttleContract::constructor(owner);
        // now switch caller
        let bob = ContractAddress::from(0xB);
        set_caller_address(bob);
        let alice = ContractAddress::from(0xA);
        ShuttleContract::deposit_for(alice, 1_u128);
    }
}



