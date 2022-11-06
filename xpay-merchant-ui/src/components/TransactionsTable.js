import { Button, Table, Typography } from "antd";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { COVALENT_API_KEY, FIRESTORE_DB } from "../config";

const { Link } = Typography;

function TransactionsTable(props) {
  const [dataSource, setDataSource] = useState([]);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    getTransactions();
  }, []);

  async function getTransactions() {
    // call covalent for transactions for the merchant's address props.address
    // get all records where merchantId == merchantId (props.merchantId)
    const covalentUrl = `https://api.covalenthq.com/v1/137/address/${props.address}/transactions_v2/?quote-currency=USD&key=${COVALENT_API_KEY}`
    let covalentTxs;
    let dbTxs;
    try {
      const res = await fetch(covalentUrl);
      const json = await res.json();
      covalentTxs = json.data.items;

      const q = query(collection(FIRESTORE_DB, "test"), where("merchantId", "==", props.merchantId));
      dbTxs = await getDocs(q);
    } catch (e) {
      console.error(e);
      return;
    }

    // match up transactions from these things.. sort by time created
    const dbTxMap = {};
    dbTxs.forEach(doc => {
      const { usdcTx } = doc.data();
      if (!usdcTx) return;
      dbTxMap[usdcTx] = doc.data();
    });


    const validCovalentTxs = covalentTxs.filter(tx => {
      return tx.from_address !== props.address && tx.tx_hash in dbTxMap;
    }).map(tx => {
      return {
        orderId: dbTxMap[tx.tx_hash].orderId,
        hash: tx.tx_hash,
        createdTime: tx.block_signed_at,
        tenderly: tx.tx_hash,
      }
    });

    // sort by createdTime
    validCovalentTxs.sort((a, b) => {
      const aDate = new Date(a.createdTime);
      const bDate = new Date(b.createdTime);
      return bDate.getTime() - aDate.getTime();
    });

    // set the datasource
    setDataSource(validCovalentTxs);
  }

  async function handleReload() {
    setReloading(true);
    await getTransactions();
    setReloading(false);
  }

  const columns = [
    {
      title: "Order Id",
      dataIndex: "orderId",
      key: "orderId"
    },
    {
      title: "Transaction Hash",
      dataIndex: "txHash",
      key: "txHash",
      render: (_, { hash }) => <Link href={`https://polygonscan.com/tx/${hash}`}>{hash}</Link>
    },
    {
      title: "Debug With Tenderly",
      dataIndex: "tenderly",
      key: "tenderly",
      render: (_, { tenderly }) => <Link href={`https://dashboard.tenderly.co/tx/polygon/${tenderly}`}>Tenderly</Link>
    },

    {
      title: "Time Created",
      dataIndex: "createdTime",
      key: "createdTime"
    }
  ];
  
  return (
    <>
      <Button onClick={handleReload} loading={reloading}>Reload</Button>
      <Table dataSource={dataSource} columns={columns} />
    </>
  );
}

export default TransactionsTable;