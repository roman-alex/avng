import React, { useState, useEffect } from "react";
import Switch from "react-switch";
import {useERC20Balances, useMoralis} from "react-moralis";
import Confetti from "react-confetti";
import {
  Row,
  Col,
  Button,
  InputNumber,
  Tabs,
  notification,
} from "antd";
import styles from "./styles";
import contractInfo from "../../contracts/contractInfo.json";
import Transfers from "./components/Transfers";
import Admin from "./components/Admin";
import Charts from "./components/Charts";

function Roulette() {
  const { Moralis, chainId, account } = useMoralis();
  const { data: assets } = useERC20Balances();
  const { TabPane } = Tabs;

  const [checked, setChecked] = useState(true);
  const [amount, setAmount] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [runConfetti, setRunConfetti] = useState(false);
  const [tokenERC20Data, setTokenERC20Data] = useState();
  const [transfersAll, setTransfersAll] = useState();
  const [transfersMy, setTransfersMy] = useState();
  const [activeTab, setActiveTab] = useState("1");

  const isValidChain = chainId && chainId === "0x61";

  useEffect(() => {
    let subscription;

    if (isValidChain) {
      (async () => {
        const query = new Moralis.Query('Spins');
        subscription = await query.subscribe();
        getCurrentTabData(activeTab);
        subscription.on("create", async (object) => {
          getCurrentTabData(activeTab);
        });
      })()
    }

    return () => subscription?.unsubscribe();
  }, [chainId, account])

  useEffect(() => {
    if (assets) {
      setTokenERC20Data(assets.find(item => item.token_address === contractInfo.tokenERC20))
      // balance: "998900"
      // decimals: "18"
      // logo: null
      // name: "Custom token"
      // symbol: "ARM"
      // thumbnail: null
      // token_address: "0x8f0d7bf1f4fb5907780f85e000ee2facfde09369"
    }
  }, [assets])

  const onChange = event => setAmount(event);

  const handleSideChange = event => setChecked(event);

  const getCurrentTabData = tab => {
    switch (tab) {
      case '1':
        fetchAllSpinsData();
        break;
      case '2':
        fetchMySpinsData();
        break;
      case '4':
        fetchAllSpinsData();
        break;
      case '5':
        fetchMySpinsData();
        break;
    }
  }

  const switchTab = tab => {
    setActiveTab(tab);
    getCurrentTabData(tab);
  };

  const fetchAllSpinsData = async () => {
    const query = new Moralis.Query('Spins');
    const results = await query.descending("block_timestamp").find();
    setTransfersAll(results.map(tr => tr.attributes));
  }

  const fetchMySpinsData = async () => {
    const query = new Moralis.Query('Spins');
    query.equalTo("user", account);
    const results = await query.descending("block_timestamp").find();
    setTransfersMy(results.map(tr => tr.attributes));
  }

  const onSpin = async () => {
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

    const options = {
      contractAddress: contractInfo?.flipContract,
      functionName: "flip",
      abi: contractInfo?.abi,
      params: {
        side: checked ? 1 : 0,
        value: Moralis.Units.Token(amount, "18")
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
        Bet ${parseFloat(Moralis.Units.FromWei(bet, "18").toFixed(6))}`
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

  if (!isValidChain) {
    return <h1>Please switch to Smart Chain Testnet</h1>
  }

  return (
    <div style={styles.pageWrapper}>
      <h1 style={styles.title}>Roulette</h1>

      {tokenERC20Data && <p> {`${tokenERC20Data.symbol} ${Moralis.Units.FromWei(tokenERC20Data.balance, tokenERC20Data.decimals)}`}</p>}

      <Row style={styles.roulette} justify="space-between" align="bottom">
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
            onColor="#ff4d4f"
            offColor="#262626"
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

      <Tabs defaultActiveKey="1" tabPosition="top" onChange={switchTab}>
        <TabPane tab="All Transactions" key="1">
          <Transfers transfers={transfersAll}/>
        </TabPane>
        <TabPane tab="All Statistic" key="4">
          <Charts id="all" transfers={transfersAll} />
        </TabPane>
        <TabPane tab="My Transactions" key="2">
          <Transfers transfers={transfersMy}/>
        </TabPane>
        <TabPane tab="My Statistic" key="5">
          <Charts id="my" transfers={transfersMy} />
        </TabPane>
        <TabPane tab="Admin" key="3">
          <Admin/>
        </TabPane>
      </Tabs>

      <Confetti recycle={false} numberOfPieces={500} run={runConfetti} />
    </div>
  );
}

export default Roulette;