const axios = require("axios");

const BASE_URL = "https://veriscore-vvs1.onrender.com";

const transactions = [
  {
    transaction_id: "TXN_SEED_001",
    timestamp: "2026-07-14 02:15:00",
    sender_account: "ACC10233",
    receiver_account: "ACC10071",
    amount: 9820,
    channel: "UPI",
    sender_city: "Delhi",
    device_id: "DEV99999",
    merchant_category: "P2P",
  },
  {
    transaction_id: "TXN_SEED_002",
    timestamp: "2026-07-14 01:42:00",
    sender_account: "ACC10124",
    receiver_account: "ACC10022",
    amount: 14440,
    channel: "IMPS",
    sender_city: "Thane",
    device_id: "DEV50850",
    merchant_category: "P2P",
  },
  {
    transaction_id: "TXN_SEED_003",
    timestamp: "2026-07-14 14:30:00",
    sender_account: "ACC10058",
    receiver_account: "ACC10077",
    amount: 2140,
    channel: "UPI",
    sender_city: "Mumbai",
    device_id: "DEV80566",
    merchant_category: "P2P",
  },
  {
    transaction_id: "TXN_SEED_004",
    timestamp: "2026-07-14 20:10:00",
    sender_account: "ACC10391",
    receiver_account: "ACC10145",
    amount: 3600,
    channel: "UPI",
    sender_city: "Pune",
    device_id: "DEV22341",
    merchant_category: "P2P",
  },
  {
    transaction_id: "TXN_SEED_005",
    timestamp: "2026-07-14 11:05:00",
    sender_account: "ACC10012",
    receiver_account: "ACC10289",
    amount: 5050,
    channel: "NEFT",
    sender_city: "Nagpur",
    device_id: "DEV11200",
    merchant_category: "ecommerce",
  },
];

async function seed() {
  console.log(`Seeding transactions to ${BASE_URL}...`);
  for (const txn of transactions) {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/transactions/score`,
        txn
      );
      console.log(`✓ ${txn.transaction_id} — risk score: ${res.data.risk_score}`);
    } catch (err) {
      console.error(`✗ ${txn.transaction_id}:`, err.response?.data || err.message);
    }
  }
  console.log("\nDone. Check dashboard at https://veri-score-six.vercel.app");
}

seed();