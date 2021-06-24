
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

        const amaID = SmartWeave.transaction.id
        const timeline = blockheight + (720 * period)
        // create an AMA object and set metadata
        ama[amaID] = {
            "guest": guest,
            "endOn": timeline,
            "reward": reward,
            "guestAddress": guestAddress,
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
            "atBlockheight": blockheight
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
            "answerTXID": answerTXID,
            "atBlockheight": blockheight

        })

        return {state}

    }
    throw new ContractError(`unknown function supplied: ${input.function}`)
}

