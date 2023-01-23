require('dotenv').config()

let totalOfLitresDispensed = 0;
let totalOfVehiclesServiced = 0;
let totalOfVehiclesThatLeft = 0;
let listOfFuellingTransactions = [];
let fuellingTransaction;
let vehiclesQueue = [];
let id = 1;

const simulationDuration = Number(process.env.SIMULATION_DURATION) || 60000;
const maxVehiclesInQueue = 5;
const maxTimeInQueue = 2000;
const dispenseCapabilityByMilliseconds = 0.0015;
const maxTimeToCreateVehicle = 2200;
const minTimeToCreateVehicle = 1500;
const fuelPumps = [
  [{ pump: 3, free: true }, { pump: 2, free: true }, { pump: 1, free: true }],
  [{ pump: 6, free: true }, { pump: 5, free: true }, { pump: 4, free: true }],
  [{ pump: 9, free: true }, { pump: 8, free: true }, { pump: 7, free: true }]
]
const diesel = 'Diesel';
const lpg = 'LPG';
const unleaded = 'Unleaded';
const vehicleList = [
  {
    type: 'Car',
    tankCapacity: 10,
    fuelTypePermited: [diesel, lpg, unleaded],
    fuelType: '',
  },
  {
    type: 'Van',
    tankCapacity: 80,
    fuelTypePermited: [diesel, lpg],
    fuelType: '',
  },
  {
    type: 'HGV',
    tankCapacity: 150,
    fuelTypePermited: [diesel],
    fuelType: diesel,
  }
]

const getRandomValue = (maxValue) => {
  return Math.floor(Math.random() * maxValue);
}

const getRandomItem = (list) => {
  const maxIndex = list.length
  const itemIndex = getRandomValue(maxIndex);
  return list[itemIndex]
}

const getRandomValueInRange = (max, min) => {
  return Math.random() * (max - min + 1) + min;
}

const setTankInitialAmountOfFuel = (vehicle) => {
  const maxInitialAmountOfFuel = vehicle.tankCapacity / 4
  return getRandomValue(maxInitialAmountOfFuel)
}

const setVehicleFuelType = (vehicle) => {
  let fuelType = vehicle.fuelType
  if (vehicle.type !== 'HGV') {
    fuelType = getRandomItem(vehicle.fuelTypePermited)
  }
  return fuelType
}

const getFreePumpIndexes = () => {
  let lane;
  let position;
  for (let i = 0; i <= fuelPumps.length - 1; i++) {
    for (let j = 0; j <= fuelPumps[i].length - 1; j++) {
      let pump = fuelPumps[i][j]
      if (!pump.free) { break }
      if (isNaN(lane) || position < j) {
        lane = i
        position = j
      }
    }
  }
  return [lane, position]
}

const updateReport = (numberOfLitresDispensed, vehicle) => {
  const { id, fuelType } = vehicle
  totalOfLitresDispensed = totalOfLitresDispensed + numberOfLitresDispensed
  totalOfVehiclesServiced += 1
  fuellingTransaction = {
    vehicleId: id,
    dateTime: new Date().toISOString(),
    fuelType,
    numberOfLitresDispensed,
  }
  listOfFuellingTransactions.push(fuellingTransaction)
}

const fillTank = (vehicle, lane, position) => {
  fuelPumps[lane][position].free = false
  const litersToBeDispensed = vehicle.tankCapacity - vehicle.amountOfFuelInTank
  const millisecondsToFillTank = litersToBeDispensed / dispenseCapabilityByMilliseconds
  console.log(`Vehicle being fueled: `, vehicle)
  setTimeout(() => {
    fuelPumps[lane][position].free = true
    updateReport(litersToBeDispensed, vehicle)
  }, millisecondsToFillTank)
}

const insertInQueue = (vehicle) => {
  vehicle.queuedAt = Date.now()
  vehiclesQueue.push(vehicle)
  console.log(`Vehicle inserted in the queue: `, vehicle)
}

const createVehicle = () => {
  const vehicleType = getRandomItem(vehicleList)
  const newVehicle = {
    id,
    type: vehicleType.type,
    tankCapacity: vehicleType.tankCapacity,
    fuelTypePermited: vehicleType.fuelTypePermited,
    fuelType: setVehicleFuelType(vehicleType),
    amountOfFuelInTank: setTankInitialAmountOfFuel(vehicleType),
    queuedAt: null
  }
  id += 1
  return newVehicle
}


const handleVehiclesCreation = () => {
  let newVehicle;
  if (vehiclesQueue.length >= maxVehiclesInQueue) {
    return;
  }
  newVehicle = createVehicle()
  if (vehiclesQueue.length > 0) {
    return insertInQueue(newVehicle)
  }
  const [lane, position] = getFreePumpIndexes()
  if (!isNaN(lane)) {
    return fillTank(newVehicle, lane, position)
  }
  return insertInQueue(newVehicle)
}

const handleVehiclesQueue = () => {
  if (vehiclesQueue.length > 0) {
    let millisecondsInQueue;
    let vehicle;
    for (let i = vehiclesQueue.length - 1; i >= 0; i--) {
      vehicle = vehiclesQueue[i]
      millisecondsInQueue = Date.now() - vehicle.queuedAt
      if (millisecondsInQueue > maxTimeInQueue) {
        vehiclesQueue.splice(i, 1)
        totalOfVehiclesThatLeft += 1
        console.log(`Vehicle has left the forecourt: `, vehicle)
      } else {
        const [lane, position] = getFreePumpIndexes()
        if (!isNaN(lane)) {
          fillTank(vehicle, lane, position)
        }
      }
    }
  }
}

const showReport = () => {
  console.log(' ');
  console.log('Simulation Report:');
  console.log(`Total of litres dispensed: ${totalOfLitresDispensed}`)
  console.log(`Total of vehicles serviced: ${totalOfVehiclesServiced}`);
  console.log(`Total of vehicles that left: ${totalOfVehiclesThatLeft}`);
  listOfFuellingTransactions.forEach((transaction) => {
    console.log(transaction)
  })
}

const finishAutomatedDemoApp = (handleVehiclesCreationInterval, handleVehiclesQueueInterval) => {
  setTimeout(() => {
    clearInterval(handleVehiclesCreationInterval);
    clearInterval(handleVehiclesQueueInterval);
    showReport()
    return
  }, simulationDuration)
}

const startAutomatedDemoApp = () => {
  const handleVehiclesCreationInterval = setInterval(handleVehiclesCreation, getRandomValueInRange(maxTimeToCreateVehicle, minTimeToCreateVehicle))
  const handleVehiclesQueueInterval = setInterval(handleVehiclesQueue, 500)
  finishAutomatedDemoApp(handleVehiclesCreationInterval, handleVehiclesQueueInterval)
}

startAutomatedDemoApp()
