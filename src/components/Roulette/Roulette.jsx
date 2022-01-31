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
  Skeleton,
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
  const [balance, setBalance] = useState("1");
  const [activeTab, setActiveTab] = useState("1");

  const isValidChain = chainId && chainId === "0x61";

  useEffect(() => {
    let subscription;

    if (isValidChain) {
      (async () => {
        const query = new Moralis.Query('Spins');
        subscription = await query.subscribe();
        getCurrentTabData(activeTab);
        getBalance();
        subscription.on("create", async (object) => {
          // if (object.attributes.user === account && assets) {
          //   setTokenERC20Data(assets.find(item => item.token_address === contractInfo.tokenERC20))
          // }
          getCurrentTabData(activeTab);
          getBalance();
        });
      })()
    }

    return () => subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, account])

  useEffect(() => {
    if (assets) {
      setTokenERC20Data(assets.find(item => item.token_address === contractInfo.tokenERC20))
    }
  }, [assets])

  const handleAmountChange = event => setAmount(event);

  const handleSideChange = event => setChecked(event);

  const getCurrentTabData = tab => {
    switch (tab) {
      case '1':
      case '4':
        fetchAllSpinsData();
        break;
      case '2':
      case '5':
        fetchMySpinsData();
        break;
      default:
        fetchAllSpinsData();
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
      // getCurrentTabData(activeTab);
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

  const getBalance = async () => {
    const options = {
      contractAddress: contractInfo?.flipContract,
      functionName: "getBalance",
      abi: contractInfo?.abi,
    };

    try {
      const balance = await Moralis.executeFunction(options);
      setBalance(Moralis.Units.FromWei(balance, "18").toFixed(6))
    } catch (e) {
      // setIsWithdrawPending(false);
      // notification.open({
      //   placement: "bottomRight",
      //   message: `Code: ${e?.code}`,
      //   description: e?.message,
      // });
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
      <div style={styles.topLine}>
        {tokenERC20Data ? <p> {`My Balance: ${Moralis.Units.FromWei(tokenERC20Data.balance, tokenERC20Data.decimals)} ${tokenERC20Data.symbol}`}</p> : <Skeleton.Input style={{ width: 200, height:21 }} />}
        {tokenERC20Data ? <p> {`Roulette found: ${balance} ${tokenERC20Data.symbol}`}</p> : <Skeleton.Input style={{ width: 200, height:21 }} />}
      </div>
      <h1 style={styles.title}>Roulette</h1>
      <Row style={styles.roulette} justify="space-between" align="bottom">
        <Col span={8}>
          <p style={styles.text}>1. Choose a bet</p>
          <InputNumber
            style={styles.input}
            size="large"
            min="0.001"
            max={balance}
            defaultValue={amount}
            step="0.010000000000000000"
            onChange={handleAmountChange}
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
          <Charts id="all" transfers={transfersAll} symbol={tokenERC20Data?.symbol} />
        </TabPane>
        <TabPane tab="My Transactions" key="2">
          <Transfers transfers={transfersMy}/>
        </TabPane>
        <TabPane tab="My Statistic" key="5">
          <Charts id="my" transfers={transfersMy} symbol={tokenERC20Data?.symbol} />
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