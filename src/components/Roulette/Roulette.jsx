import React, { useState } from "react";
import Switch from "react-switch";
import {useMoralis} from "react-moralis";
import {
  Row,
  Col,
  Button,
  InputNumber, notification,
} from 'antd';
import styles from "./styles";
import contractInfo from "../../contracts/contractInfo.json";
import Confetti from "react-confetti";

function Roulette() {
  const [checked, setChecked] = useState(true);
  const [amount, setAmount] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [runConfetti, setRunConfetti] = useState(false);
  const { Moralis } = useMoralis();
  const decimals = "18";

  const onChange = event => setAmount(event);

  const handleSideChange = event => setChecked(event);

  const onSpin = async () => {
    console.log("amount: " + amount, checked ? "Red" : "Black")

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
        _value: Moralis.Units.Token(amount, decimals)
      },
    };

    const options = {
      contractAddress: contractInfo?.flipContract,
      functionName: "flip",
      abi: contractInfo?.abi,
      params: {
        side: checked ? 1 : 0,
        value: Moralis.Units.Token(amount, decimals)
      },
    };

    try {
      setIsPending(true);
      await Moralis.executeFunction(tokenApproveOptions);
      const {events} = await Moralis.executeFunction(options);
      setIsPending(false);
      const {bet, side, user, win} = events?.bet?.returnValues;

      if (win) {
        setRunConfetti(true);
      }

      openNotification({
        message: win ? "You win" : "You lose",
        description: `
        User ${user}
        Side ${side ? "Red" : "Black"}
        Bet ${parseFloat(Moralis.Units.FromWei(bet, decimals).toFixed(6))}`
      });

    } catch (e) {
      setIsPending(false);
      openNotification({
        message: `Code: ${e?.code}`,
        description: e?.message
      });
    }
  };

  const openNotification = ({ message, description }) => {
    notification.open({
      placement: "bottomRight",
      message,
      description,
      onClick: () => {
        console.log("Notification Clicked!");
      },
    });
  };

  return (
    <div style={styles.pageWrapper}>
      <Confetti recycle={false} numberOfPieces={500} run={runConfetti} />
      <h1 style={styles.title}>Roulette</h1>
      <Row justify="space-between" align="bottom">
        <Col span={8}>
          <p style={styles.text}>1. Choose a bet</p>
          <InputNumber
            style={styles.input}
            size="large"
            min="0.001"
            max="10"
            defaultValue={amount}
            step="0.010000000000000000"
            onChange={onChange}
          />
        </Col>
        <Col span={8}>
          <p style={styles.text}>2. Pick a side</p>
          <Switch
            onChange={handleSideChange}
            checked={checked}
            onColor="#f5222d"
            offColor="#000000"
            activeBoxShadow="0px 0px 1px 2px #fff"
            height={50}
            width={150}
            handleDiameter={35}
            uncheckedIcon={<div style={styles.checkedIcon}>Black</div>}
            checkedIcon={<div style={styles.checkedIcon}>Red</div>}
          />
        </Col>
        <Col span={8}>
          <p style={styles.text}>3. And then spin</p>
          <Button
            style={styles.spinBtn}
            shape="round"
            onClick={onSpin}
            loading={isPending}
            disabled={isPending}
          >
            Spin
          </Button>
        </Col>
      </Row>
    </div>
  );
}

export default Roulette;