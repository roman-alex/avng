import React from "react";
import { useMoralis } from "react-moralis";
import moment from "moment";
import { getEllipsisTxt } from "../../../helpers/formatters";
import { getExplorer } from "../../../helpers/networks";
import { Skeleton, Table } from "antd";

const Transfers = ({transfers}) => {
  const { Moralis, chainId } = useMoralis();

  const columns = [
    {
      title: "Time",
      dataIndex: "block_timestamp",
      key: "block_timestamp",
      render: (time) => {
        let date = moment(time).format('MM/DD/YY, HH:mm:ss');
        return `${date}`
      },
    },
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      render: (to) => getEllipsisTxt(to, 6),
    },
    {
      title: "Side",
      dataIndex: "side",
      key: "side",
      render: (side) => side ? <div>Red</div> : <div>Black</div>,
    },
    {
      title: "Win",
      dataIndex: "win",
      key: "win",
      render: (win) => win ? <div>win</div> : <div>lose</div>,
    },
    {
      title: "Bet",
      dataIndex: "bet",
      key: "bet",
      render: (value, item) => parseFloat(Moralis.Units.FromWei(value, item.decimals).toFixed(6)),
    },
    {
      title: "Hash",
      dataIndex: "transaction_hash",
      key: "transaction_hash",
      render: (hash) => (
        <a href={`${getExplorer(chainId)}tx/${hash}`} target="_blank" rel="noreferrer">
          View Transaction
        </a>
      ),
    },
  ];

  let key = 0;
  return (
    <Skeleton loading={!transfers}>
      <Table
        dataSource={transfers}
        columns={columns}
        rowKey={(record) => {
          key++;
          return `${record.transaction_hash}-${key}`;
        }}
      />
    </Skeleton>
  );
}

export default Transfers;
