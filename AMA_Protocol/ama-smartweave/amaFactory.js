
export async function handle (state, action) {
    const caller = action.caller
    const input = action.input
    const ama = state.ama
    const verifiedCreators = state.verifiedCreator

    const blockheight = SmartWeave.block.height
    // the address used by ArweaveNews to organize AMAs
    
    if (input.function === "createAMA") {
        // guest name or nickname
        const guest = input.guest
        // AMA period in days (time of accepting questions)
        const period = input.period
        // ARN reward for each answered question
        const reward = input.reward
        // The address of the guest which will be used by them to answer the questions
        const guestAddress = input.guestAddress
        //some info about the guest.
        const description = input.description

        if (! verifiedCreators.includes(caller)) {
            throw new ContractError(`your address is not recognized as verified creator`)
        }

        if (typeof guest !== "string") {
            throw new ContractError(`invalid guest type`)
        }

        if (! Number.isInteger(period)) {
            throw new ContractError(`invalid period type`)
        }

        if (typeof guestAddress !== "string" || guestAddress.length !== 43) {
            throw new ContractError(`invalid address`)
        }

        if (! Number.isInteger(reward)) {
            throw new ContractError(`invalid reward amount`)
        }
        
        if (reward > 25) {
            throw new ContractError(`reward amount per user is too high`)
        }
        
        if (typeof description !== "string") {
            throw new ContractError(`wrong value type`)
        }

        if (description.length > 350) {
            throw new ContractError(`description too long`)
        }

        const amaID = SmartWeave.transaction.id
        const timeline = blockheight + (720 * period)
        // create an AMA object and set metadata
        ama[amaID] = {
            "guest": guest,
            "endOn": timeline,
            "reward": reward,
            "id": amaID,
            "guestAddress": guestAddress,
            "description": description,
            "questions": [],
            "answers": []
        }

        return {state}
    }

    if (input.function === "ask") {

        const amaID = input.id
        const question = input.question

        if (! ama[amaID]) {
            throw new ContractError(`invalid AMA ID`)
        }

        if (question.length < 10) {
            throw new ContractError(`too low question length`)
        }

        if (question.length > 500) {
            throw new ContractError(`too high question length`)
        }

        if (blockheight > ama[amaID]["endOn"]) {
            throw new ContractError(`AMA receiving questions period has been closed on blockheight ${ama[amaID]["endOn"]}`)
        }

        const questionTXID = SmartWeave.transaction.id
        // add the question object to the questions array
        ama[amaID]["questions"].push({
            "QID": questionTXID,
            "question": question,
            "asker": caller,
            "atBlockheight": blockheight,
            "id": amaID
        })

        return {state}
    }

    if (input.function === "answer") {
        const amaID = input.id
        const answer = input.answer
        const questionID = input.qid

        if (! ama[amaID]) {
            throw new ContractError(`invalid AMA ID`)
        }

        if (answer.length < 3) {
            throw new ContractError(`too low question length`)
        }

        if (answer.length > 1000) {
            throw new ContractError(`too high question length`)
        }

        if (caller !== ama[amaID]["guestAddress"]) {
            throw new ContractError(`only the guest can answer the questions`)
        }

        const questionsIDS = ama[amaID]["questions"].map(question => question["QID"])

        if (! questionsIDS.includes(questionID)) {
            throw new ContractError(`undefined question ID`)
        }

        const answerTXID = SmartWeave.transaction.id
        // add the answer object to the answers array
        ama[amaID]["answers"].push({
            "answerTo": questionID,
            "answer": answer,
            "AID": answerTXID,
            "atBlockheight": blockheight,
            "id": amaID

        })

        return {state}
    }
    
    if (input.function === "status") {
        const amaID = input.id
        const currentBlockHeight = SmartWeave.block.height

        if (! ama[amaID]) {
            throw new ContractError(`invalid AMA ID`)
        }

        const status = currentBlockHeight < ama[amaID]["endOn"] ? "ongoing" : "done"

        return {result: status}
    }

    /**
     * the following funtions require "verifiedCreator" permission.
     * 
     * forceStop: ends an AMA before its deadline
     * addCreator: an existing verified creator can add other creators
     * removeCreator: a creator can remove him/her-self from the verifiedCreators array
     * 
     **/

    if (input.function == "forceStop") {
        const amaID = input.id
        const currentBlockHeight = SmartWeave.block.height

        if (! ama[amaID]) {
            throw new ContractError(`AMA having id : ${amaID} not found`)
        }

        if (! verifiedCreators.includes(caller)) {
            throw new ContractError(`You don't have permission to invoke this function`)
        }

        if (ama[amaID]["endOn"] < currentBlockHeight) {
            throw new ContractError(`AMA already closed`)
        }

        //if the AMA is not ended,
        //set it's "endOn" value to
        // the current network blockheight

        ama[amaID]["endOn"] = currentBlockHeight

        return { state }
    }
    
    if (input.function === "addCreator") {
        const address = input.address

        if (! verifiedCreators.includes(caller)) {
            throw new ContractError(`You don't have permission to invoke this function`)
        }

        if (typeof address !== "string" || address.length !== 43) {
            throw new ContractError(`invalid Arweave address`)
        }

        if (verifiedCreators.includes(address)) {
            throw new ContractError(`${address} already exist in verifiedCreators array`)
        }

        verifiedCreators.push(address)

        return { state }
    }
    
    if (input.function === "removeCreator") {
        const address = input.address

        if (! verifiedCreators.includes(address)) {
            throw new ContractError(`${address} is not found in verifiedCreators`)
        }

        if (! verifiedCreators.includes(caller)) {
            throw new ContractError(`You don't have permission to invoke this function`)
        }

        if (caller !== address) {
            throw new ContractError(`only the creator can call this function`)
        }

        const addressIndex = verifiedCreators.indexOf(address)
        verifiedCreators.splice(addressIndex, 1)

        return { state }

    }
    
    if (input.function === "addLog") {
        const swcID = input.swcID

        if ( logs.includes(swcID) ) {
            throw new ContractError(`SWC having ID: ${swcID} is already recorded`)
        }

        if (typeof swcID !== "string" || swcID.length !== 43) {
            throw new ContractError(`invalid SWC ID`)
        }

        if (! verifiedCreators.includes(caller) ) {
            throw new ContractError(`You don't have permission to perform this action`)
        }

        logs.push(swcID)
        return { state }

    }

    if (input.function === "removeLog") {
        const id = input.id 

        if (! Number.isInteger(id) ) {
            throw new ContractError(`invalid id`)
        }

        if (! logs[id]) {
            throw new ContractError(`SWC address having ID ${id} not found`) 
        }

        logs.splice(id, 1)
        return { state }
    }

    throw new ContractError(`unknown function supplied: ${input.function}`)
}

