import React, { useState, useEffect } from "react";
import Switch from "react-switch";
import { useMoralis, useMoralisWeb3Api } from "react-moralis";
import Confetti from "react-confetti";
import {
  Row,
  Col,
  Button,
  InputNumber,
  Tabs,
  notification,
  Skeleton,
  Card,
  Modal
} from "antd";
import styles from "./styles";
import contractInfo from "../../contracts/contractInfo.json";
import Transfers from "./components/Transfers";
import Admin from "./components/Admin";
import Charts from "./components/Charts";

function Roulette() {
  const web3 = useMoralisWeb3Api();
  const { Moralis, chainId, account, isAuthenticated } = useMoralis();
  const { TabPane } = Tabs;

  const [checked, setChecked] = useState(true);
  const [amount, setAmount] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [isContractOwner, setIsContractOwner] = useState(false);
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
        const query = new Moralis.Query('Bets');
        subscription = await query.subscribe();
        updateData();
        if (isAuthenticated) {
          checkContractOwner()
        }
        subscription.on("create", object => {
          const { user, bet, win } = object?.attributes;
          if (user === account) {
            setIsPending(false);
            showModal(bet, win);
          }
          updateData();
        });
      })();
    }
    return () => subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, account, isAuthenticated])

  const updateData = () => {
    getCurrentTabData(activeTab);
    getUserBalance();
    if (isAuthenticated) {
      getContractBalance();
    }
  };

  const getUserBalance = async () => {
    const assets = await web3.account.getTokenBalances({ chain: chainId });
    setTokenERC20Data(assets.find(item => item.token_address?.toLowerCase() === contractInfo.tokenERC20?.toLowerCase()));
  };

  const handleAmountChange = event => setAmount(event);

  const handleSideChange = event => setChecked(event);

  const getCurrentTabData = tab => {
    switch (tab) {
      case '1':
      case '4':
        fetchAllBetsData();
        break;
      case '2':
      case '5':
        fetchMyBetsData();
        break;
      default:
        break;
    }
  }

  const showModal = (bet, win) => {
    if (win) {
      setRunConfetti(true);
      Modal.success({
        centered: true,
        title: `You win ${parseFloat(Moralis.Units.FromWei(bet, "18"))} ${contractInfo.tokenERC20Symbol} !`,
      });
    } else {
      Modal.error({
        centered: true,
        title: `You lose ${parseFloat(Moralis.Units.FromWei(bet, "18"))} ${contractInfo.tokenERC20Symbol} !`,
      });
    }
  };

  const switchTab = tab => {
    setActiveTab(tab);
    getCurrentTabData(tab);
  };

  const fetchAllBetsData = async () => {
    const query = new Moralis.Query('Bets');
    const results = await query.descending("block_timestamp").find();
    setTransfersAll(results.map(tr => tr.attributes));
  }

  const fetchMyBetsData = async () => {
    const query = new Moralis.Query('Bets');
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
      await Moralis.executeFunction(options);
      updateData();
      setIsPending(false);
    } catch (e) {
      setIsPending(false);
      openNotification({
        message: `Code: ${e?.code}`,
        description: e?.message
      });
    }
  };

  const getContractBalance = async () => {
    const options = {
      contractAddress: contractInfo?.flipContract,
      functionName: "getBalance",
      abi: contractInfo?.abi,
    };

    try {
      const balance = await Moralis.executeFunction(options);
      setBalance(Moralis.Units.FromWei(balance, "18"))
    } catch (e) {
      openNotification({
        message: `Code1: ${e?.code}`,
        description: e?.message
      });
    }
  };

  const checkContractOwner = async () => {
    const options = {
      contractAddress: contractInfo?.flipContract,
      functionName: "owner",
      abi: contractInfo?.abi,
    };

    try {
      const owner = await Moralis.executeFunction(options);
      setIsContractOwner(owner?.toLowerCase() === account.toLowerCase())
    } catch (e) {
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
    });
  };

  if (!isValidChain) {
    return <h1>Please switch to Smart Chain Testnet</h1>
  }

  return (
    <div style={styles.pageWrapper}>
      <h1 style={styles.title}>Place a bet and get X2 with a 50% chance 🤑</h1>
      <Card
        style={styles.rouletteCard}
        title={isAuthenticated && tokenERC20Data ?
          <p style={styles.rouletteCardTitle}>
            Your balance is <b>{`${Moralis.Units.FromWei(tokenERC20Data.balance, tokenERC20Data.decimals)} ${tokenERC20Data.symbol}`}</b>.
            Roulette fund is <b>{`${balance} ${tokenERC20Data.symbol}`}</b>
          </p>
          : isAuthenticated ? <Skeleton.Input style={{ width: 700, height: 32 }}/> : null
        }
      >
        <Row justify="space-between" align="bottom">
          <Col span={8}>
            <p style={styles.text}>1. Place a bet</p>
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
      </Card>

      <Tabs defaultActiveKey="1" tabPosition="top" onChange={switchTab}>
        <TabPane tab="All Transactions" key="1">
          <Transfers transfers={transfersAll}/>
        </TabPane>
        <TabPane tab="All Statistic" key="4">
          <Charts id="all" transfers={transfersAll} symbol={tokenERC20Data?.symbol} />
        </TabPane>
        {isAuthenticated &&
          <>
            <TabPane tab="My Transactions" key="2">
              <Transfers transfers={transfersMy}/>
            </TabPane>
            <TabPane tab="My Statistic" key="5">
              <Charts id="my" transfers={transfersMy} symbol={tokenERC20Data?.symbol} />
            </TabPane>
          </>
        }
        {isAuthenticated && isContractOwner &&
          <TabPane tab="Admin" key="3">
            <Admin updateData={updateData} />
          </TabPane>
        }
      </Tabs>

      <Confetti recycle={false} numberOfPieces={500} run={runConfetti} />
    </div>
  );
}

export default Roulette;