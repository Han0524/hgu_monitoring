const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCqcuHvJwtE1TO6lyUuH20O8no5fuHnN7s",
  authDomain: "capstone-c6d9e.firebaseapp.com",
  databaseURL: "https://capstone-c6d9e-default-rtdb.firebaseio.com",
  projectId: "capstone-c6d9e",
  storageBucket: "capstone-c6d9e.appspot.com",
  messagingadderId: "164554046589",
  appId: "1:164554046589:web:cd640b8d44a6bc9bc70514",
  measurementId: "G-K7B3FH99ZC",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const util = require("../../util.js");

const currentDate = new Date();
const yyyyMM = currentDate.toISOString().slice(0, 7); // YYYY-MM format
const dayDD = currentDate.getDate().toString().padStart(2, "0"); // DD format
// const dayDD = "15"; // DD format
const hhmmss = currentDate.toLocaleTimeString("en-US", { hour12: false }); // HH:MM:SS format

const substanceType = ["humidity", "tempareture", "pm10", "pm25", "ch2o"];

async function addLoraDataToFirestore() {
  const loraContent = util.generateAllnodesTestData();
  console.log("🚀 ~ addLoraDataToFirestore ~ loraContent:", loraContent);

  for (let index = 0; index < loraContent.length; index++) {
    let numberOfNodes = 0;
    const allSubstanceDataArray = [];
    const nodeAddressArray = [];
    let errContainFlag = false;
    const nodeStrings = loraContent[index]
      .split("//")
      .filter((data) => data !== "");

    nodeStrings.forEach((nodeString) => {
      const nodeData = nodeString
        .split("/")
        .map((data, index) => {
          if (index === 0) {
            // 첫 번째 숫자는 nodeAddress이므로 nodeAddressArray에 추가
            if (!isNaN(parseInt(data, 10))) {
              nodeAddressArray.push(parseInt(data, 10));
              numberOfNodes++;
            } else {
              errContainFlag = true;
            }
            return null; // nodeAddress는 데이터 배열에 추가하지 않음
          } else {
            return !data.includes(".") ? parseInt(data, 10) : parseFloat(data);
          }
        })
        .filter((data) => data !== null);
      if (nodeData.length > 0) allSubstanceDataArray.push(nodeData);
    });

    console.log("Total Node Count:", numberOfNodes);
    console.log("Node Numbers:", nodeAddressArray);
    console.log("All Node Data Array:", allSubstanceDataArray);

    if (errContainFlag) {
      console.log(
        "🚀 ~ addLoraDataToFirestore ~ errContainFlag:",
        errContainFlag
      );
      addErrData(loraContent[index]);
    }
    addRawData(loraContent[index]);

    for (let i = 0; i < numberOfNodes; i++) {
      const nodeAddress = nodeAddressArray[i];
      const substanceDataArray = allSubstanceDataArray[i];

      // 모든 노드, 모든 물질,  15개노드 7개 물질 -> 최대 105개 query
      addMonthlyRawData(nodeAddress, substanceDataArray);
      // 모든 노드, 15개노드 -> 최대 15개 query
      addDailyRawData(nodeAddress, substanceDataArray);
      // 모든 노드, 15개노드 * 2개 쿼리 -> 최대 30개 query
      addHourlyRawData(nodeAddress, substanceDataArray);
    }
  }
  return;
}

function addMonthlyRawData(nodeAddress, substanceDataArray) {
  for (let i = 0; i < substanceDataArray.length; i++) {
    const substanceData = substanceDataArray[i];
    const substanceName = substanceType[i];

    const monthlyRawDataRef = collection(
      db,
      `monthly-raw-data/${yyyyMM}/${substanceName}/node${nodeAddress}/day${dayDD}`
    );

    const dataObject = {
      "node-address": nodeAddress,
      date: `${yyyyMM}-${dayDD}`,
      timestamp: hhmmss,
      [substanceName]: substanceData,
    };

    addDoc(monthlyRawDataRef, dataObject);
    console.log("Monthly done");
  }
}

function addDailyRawData(nodeAddress, substanceDataArray) {
  const dailyRawDataRef = collection(
    db,
    `daily-raw-data/${yyyyMM}/day${dayDD}/node${nodeAddress}/data`
  );

  const dataObject = {
    "node-address": nodeAddress,
    date: `${yyyyMM}-${dayDD}`,
    timestamp: hhmmss,
    [substanceType[0]]: substanceDataArray[0],
    [substanceType[1]]: substanceDataArray[1],
    [substanceType[2]]: substanceDataArray[2],
    [substanceType[3]]: substanceDataArray[3],
    [substanceType[4]]: substanceDataArray[4],
  };

  addDoc(dailyRawDataRef, dataObject);
  console.log("Daily done");
}

function addHourlyRawData(nodeAddress, substanceDataArray) {
  const hh = currentDate.getHours().toString().padStart(2, "0"); // HH format
  const hour = (parseInt(hh, 10) + 1).toString();

  const hourlyNodeRawDataRef = collection(
    db,
    `hourly-raw-data/${yyyyMM}/day${dayDD}/hour${hour}/node${nodeAddress}`
  );

  const dataObject = {
    "node-address": nodeAddress,
    date: `${yyyyMM}-${dayDD}`,
    timestamp: hhmmss,
    [substanceType[0]]: substanceDataArray[0],
    [substanceType[1]]: substanceDataArray[1],
    [substanceType[2]]: substanceDataArray[2],
    [substanceType[3]]: substanceDataArray[3],
    [substanceType[4]]: substanceDataArray[4],
  };

  setDoc(
    doc(
      hourlyNodeRawDataRef,
      `node${nodeAddress} : ${yyyyMM}-${dayDD} ${hhmmss}`
    ),
    dataObject
  );
  console.log("hourly Node done");
}

function addErrData(loraContent) {
  const errDataRef = collection(db, `err-data`);
  const dataObject = {
    date: `${yyyyMM}-${dayDD}`,
    timestamp: hhmmss,
    errData: loraContent,
  };

  addDoc(errDataRef, dataObject);
}

function addRawData(loraContent) {
  const errDataRef = collection(db, `raw-data/${yyyyMM}/day${dayDD}`);
  const dataObject = {
    date: `${yyyyMM}-${dayDD}`,
    timestamp: hhmmss,
    errData: loraContent,
  };

  addDoc(errDataRef, dataObject);
}

// cal_monthly_data();
addLoraDataToFirestore();
console.log("start");