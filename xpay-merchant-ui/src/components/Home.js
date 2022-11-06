import { Button, Input, Typography } from "antd";
import { useEffect, useState } from "react";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { signOut } from "firebase/auth";

const { Title, Paragraph, Text, Link } = Typography;

function Home(props) {
  const [merchantId, setMerchantId] = useState(undefined);
  const [genMerchIdLoading, setGenMerchIdLoading] = useState(false);
  const [merchantAddress, setMerchantAddress] = useState("");
  const [updateMerchantAddrLoading, setUpdateMerchantAddrLoading] =
    useState(false);

  useEffect(() => {
    getDoc(doc(FIRESTORE_DB, "test-merchant", props.user.uid))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const { merchantId, merchantAddress } = snapshot.data();
          setMerchantId(merchantId);
          setMerchantAddress(merchantAddress ?? "");
        }
      })
      .catch(console.error);
  }, [props.user]);

  async function genMerchId() {
    setGenMerchIdLoading(true);

    // generate id
    const nanoId = nanoid();

    try {
      await setDoc(
        doc(FIRESTORE_DB, "test-merchant", props.user.uid),
        {
          merchantId: nanoId,
        },
        { merge: true }
      );
    } catch (e) {
      console.error(e);
      setGenMerchIdLoading(false);
      return;
    }

    setGenMerchIdLoading(false);
    setMerchantId(nanoid);
  }

  async function updateAddr() {
    setUpdateMerchantAddrLoading(true);

    try {
      await setDoc(
        doc(FIRESTORE_DB, "test-merchant", props.user.uid),
        {
          merchantAddress: merchantAddress,
        },
        { merge: true }
      );
    } catch (e) {
      console.error(e);
    }

    setUpdateMerchantAddrLoading(false);
  }

  function handleSignOut() {
    signOut(FIREBASE_AUTH)
      .catch(console.error);
  }

  const merchantIdMessage = merchantId
    ? `Your Merchant ID is ${merchantId}`
    : "Please generate a merchant ID";

  const genIdButton = merchantId ? (
    <></>
  ) : (
    <Button style={{ width: "100%", marginBottom: "15px" }} loading={genMerchIdLoading} type="primary" onClick={genMerchId}>
      Generate Merchant ID
    </Button>
  );

  const merchantXPayUrl = merchantId ? `https://nik-suri.github.io/xpay-ui/#/?merchantId=${merchantId}` : "";

  const merchantInstructions = merchantId ? (
    <div style={{ marginTop: "20px" }}>
      <Paragraph>
        To activate xPay on Shopify, please enable a <Link href="https://help.shopify.com/en/manual/payments/manual-payments#create-a-custom-manual-payment-method">Custom Manual Payment Method</Link>.
      </Paragraph>
      <Paragraph>
        Call the payment method <Text strong>xPay</Text>.
      </Paragraph>
      <Paragraph>
        In the "Additional details" section, paste the following: <Text strong>Pay with crypto (experimental). You can pay in ETH, SOL, MATIC, USDC, USDT and more. Note: you need metamask or a similar wallet... and some experience.</Text>
      </Paragraph>
      <Paragraph>
        In the "Payment instructions" section, paste the following:
      </Paragraph>
      <Paragraph strong>
        Thank you for choosing to pay with xPay! Please navigate to <Link href={merchantXPayUrl}>{merchantXPayUrl}</Link> to complete your payment. 
      </Paragraph>
      <Paragraph strong>
        Once you are on xPay, please correctly enter the USD amount of the item that you just purchased and the order ID that you see above. If you do not enter the correct amount or order ID, your order will not be processed.
      </Paragraph>
      <Paragraph strong>
        Then, navigate through the payment flow to complete your transaction. Thank you!
      </Paragraph>
    </div>
  ) : <></>;

  return (
    <div className="home-page">
      <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
        <Title level={2}>Hello {props.user.email}</Title>
        <Button style={{ marginLeft: "auto" }} onClick={handleSignOut}>Sign Out</Button>
      </div>
      <Title level={2}>{merchantIdMessage}</Title>
      {genIdButton}
      <div style={{ display: "flex" }}>
        <Input
          size="large"
          placeholder="Your Polygon Address (to receive USDC)"
          value={merchantAddress}
          onChange={(e) => setMerchantAddress(e.target.value)}
        />
        <Button
          size="large"
          type="primary"
          onClick={updateAddr}
          loading={updateMerchantAddrLoading}
        >
          Update
        </Button>
      </div>
      {merchantInstructions}
    </div>
  );
}

export default Home;
