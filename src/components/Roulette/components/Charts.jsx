import React, { useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import { Row, Col } from "antd";
import Chart from "./Chart";

const Charts = ({
  id,
  transfers
}) => {
  const { Moralis } = useMoralis();
  const [betData, setBetData] = useState([]);
  const [betAmountData, setBetAmountData] = useState([]);
  const [betWinData, setBetWinData] = useState([]);
  const [betWinAmountData, setBetWinAmountData] = useState([]);

  useEffect(() => {
    if (transfers) {
      const redTransfers = transfers.filter(item => item.side)
      const blackTransfers = transfers.filter(item => !item.side)
      const winTransfers = transfers.filter(item => item.win)
      const redWinTransfers = winTransfers.filter(item => item.side)
      const blackWinTransfers = winTransfers.filter(item => !item.side)

      setBetData([{
        side: "Black",
        value: blackTransfers.length
      }, {
        side: "Red",
        value: redTransfers.length
      }])

      setBetAmountData([{
        side: "Black",
        value: parseFloat(Moralis.Units.FromWei(blackTransfers.reduce((total, num) => total + +num.bet, 0), "18").toFixed(6))
      }, {
        side: "Red",
        value: parseFloat(Moralis.Units.FromWei(redTransfers.reduce((total, num) => total + +num.bet, 0), "18").toFixed(6))
      }])

      setBetWinData([{
        side: "Black",
        value: blackWinTransfers.length
      }, {
        side: "Red",
        value: redWinTransfers.length
      }])

      setBetWinAmountData([{
        side: "Black",
        value: parseFloat(Moralis.Units.FromWei(blackWinTransfers.reduce((total, num) => total + +num.bet, 0), "18").toFixed(6))
      }, {
        side: "Red",
        value: parseFloat(Moralis.Units.FromWei(redWinTransfers.reduce((total, num) => total + +num.bet, 0), "18").toFixed(6))
      }])
    }
  }, [transfers])

  return (
    <Row>
      <Col span={12}>
        <Chart
          id={`${id}-bet-chart`}
          title="All bets (times)"
          data={betData}
        />
      </Col>
      <Col span={12}>
        <Chart
          id={`${id}-bet-amount-chart`}
          title="All bets (tokens)"
          data={betAmountData}
          legendLabelText="AVG"
        />
      </Col>
      <Col span={12}>
        <Chart
          id={`${id}-bet-win-chart`}
          title="Win bets (times)"
          data={betWinData}
        />
      </Col>
      <Col span={12}>
        <Chart
          id={`${id}-bet-win-amount-chart`}
          title="Win bets (tokens)"
          data={betWinAmountData}
          legendLabelText="AVG"
        />
      </Col>
    </Row>
  );
}

export default Charts;
