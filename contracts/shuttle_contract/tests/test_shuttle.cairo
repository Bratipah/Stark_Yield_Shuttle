#[cfg(test)]
mod tests {
    use starknet::testing::set_caller_address;
    use starknet::ContractAddress;
    use super::super::ShuttleContract;

    #[test]
    fn deposit_and_withdraw_flow() {
        let user = ContractAddress::from(0x123);
        set_caller_address(user);

        ShuttleContract::constructor();

        ShuttleContract::deposit_btc(1); // 0.01 BTC in demo units
        let bal1 = ShuttleContract::get_balance(user);
        assert(bal1 == 1, 'balance after deposit');

        ShuttleContract::withdraw_btc(0);
        let bal2 = ShuttleContract::get_balance(user);
        assert(bal2 == 1, 'balance unchanged when withdrawing zero');
    }
}


