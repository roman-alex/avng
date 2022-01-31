import React, { useState } from "react";
import {
  Input,
  Button,
  InputNumber,
  notification,
  Card,
} from "antd";
import { useMoralis } from "react-moralis";
import styles from "./../styles";
import contractInfo from "../../../contracts/contractInfo.json";
import {getEllipsisTxt} from "../../../helpers/formatters";

const Admin = () => {
  const { Moralis } = useMoralis();
  const [amount, setAmount] = useState(1);
  const [isFundPending, setIsFundPending] = useState(false);
  const [isWithdrawPending, setIsWithdrawPending] = useState(false);

  const handleAmountChange = event => setAmount(event);

  const onFund = async () => {
    const tokenApproveOptions = {
      contractAddress: contractInfo.tokenERC20,
      functionName: "approve",
      abi: [
        {
          "constant": false,
          "inputs": [
            {
              "name": "_spender",
              "type": "address"
            },
            {
              "name": "_value",
              "type": "uint256"
            }
          ],
          "name": "approve",
          "outputs": [
            {
              "name": "",
              "type": "bool"
            }
          ],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      params: {
        _spender: contractInfo?.flipContract,
        _value: Moralis.Units.Token(amount, "18")
      },
    };

    const fundContractOptions = {
      contractAddress: contractInfo?.flipContract,
      functionName: "fundContract",
      abi: contractInfo?.abi,
      params: {
        value: Moralis.Units.Token(amount, "18")
      },
    };

    try {
      setIsFundPending(true);
      await Moralis.executeFunction(tokenApproveOptions);
      const tx = await Moralis.executeFunction(fundContractOptions);
      const amount = parseFloat(Moralis.Units.FromWei(tx?.events.funded.returnValues.funding, "18").toFixed(6));
      setIsFundPending(false);

      notification.open({
        placement: "bottomRight",
        message: `Fund`,
        description: `${amount} tokens were funded`,
      });

    } catch (e) {
      setIsFundPending(false);
      notification.open({
        placement: "bottomRight",
        message: `Code: ${e?.code}`,
        description: e?.message,
      });
    }
  };

  const onWithdraw = async () => {
    const withdrawAllOptions = {
      contractAddress: contractInfo?.flipContract,
      functionName: "withdrawAll",
      abi: contractInfo?.abi,
    };

    try {
      setIsWithdrawPending(true);
      const tx = await Moralis.executeFunction(withdrawAllOptions);
      const amount = parseFloat(Moralis.Units.FromWei(tx?.events.withdrawed.returnValues.funding, "18").toFixed(6));
      setIsWithdrawPending(false);

      notification.open({
        placement: "bottomRight",
        message: `Withdrawn`,
        description: `${amount} tokens were withdrawn to ${getEllipsisTxt(tx?.events.withdrawed.returnValues[0], 6)}`,
      });

    } catch (e) {
      setIsWithdrawPending(false);
      notification.open({
        placement: "bottomRight",
        message: `Code: ${e?.code}`,
        description: e?.message,
      });
    }
  };

  return (
    <Card style={styles.cardAdmin}>
      <p style={styles.text}>As an Admin you are able to fund the contract:</p>
      <Input.Group compact>
        <InputNumber
          style={styles.input}
          size="large"
          min="0.001"
          max="10"
          defaultValue={amount}
          step="0.010000000000000000"
          onChange={handleAmountChange}
        />
        <Button
          size="large"
          type="primary"
          loading={isFundPending}
          disabled={isFundPending}
          onClick={onFund}
        >Fund Contract</Button>
      </Input.Group>
      <br/>
      <p style={styles.text}>Also you can withdraw all funds from the contract:</p>
      <Button
        danger
        size="large"
        type="primary"
        loading={isWithdrawPending}
        disabled={isWithdrawPending}
        onClick={onWithdraw}
      >Withdraw All</Button>
    </Card>
  );
}

export default Admin;
