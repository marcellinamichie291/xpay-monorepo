import axios from 'axios';
import {COVALENT_API_KEY} from './constants'
import bigDecimal from 'js-big-decimal';

interface Transaction {
    tx_hash: string,
    to_address: string,
    from_address: string,
    token_contract: string,
    token_amount: string
    token_decimals: number,
    token_name: string,
}

export async function covalentGetTransaction(chain_id: number, tx_hash: string, expected_dest: string|undefined):Promise<Transaction> {
    let url = `https://api.covalenthq.com/v1/${chain_id}/transaction_v2/${tx_hash}/?key=${COVALENT_API_KEY}`;
    console.log(url);
    let response;
    try {
        response = await axios.get(url);
        console.log("successfully queried covalent");
    } catch (e) {
        console.log("error querying covalent");
        throw e;
    }
    let token_contract = ""
    let token_decimals = 18;
    let token_amount = "100";
    let token_name = ""
    let data = response.data.data.items[0]

    let from_address = data.from_address
    let to_address = data.to_address
    for (var log of data.log_events) {
        if (log.decoded != null && log.decoded != undefined) {
            let event = log.decoded;
            // console.log(event)
            if (event.name == "Transfer") {

                if (expected_dest != undefined) {
                    let expected = false;
                    for (var param of event.params) {
                        if (param.name == "to") {
                            if (param.value.toLowerCase() == expected_dest.toLowerCase()) {
                                expected = true;
                            }
                        }
                    }
                    if (!expected) {
                        continue
                    }
                }
                token_contract = log.sender_address
                token_decimals = log.sender_contract_decimals
                token_name = log.sender_name
                for (var param of event.params) {
                    if (param.name == "from") {
                        from_address = param.value;
                    }
                    if (param.name == "to") {
                        to_address = param.value;
                    }
                    if (param.name == "value") {
                        token_amount = param.value;
                    }
                }
            // } else if (event.name == event_name && event_name == "Swap") {
            //     console.log(log)
            //     console.log(event.params)
            //     token_contract = log.sender_address
            //     token_decimals = log.sender_contract_decimals
            //     token_name = log.sender_name

            //     for (var param of event.params) {
            //         if (param.name == "amount1") {
            //             let value = (new bigDecimal(param.value)).multiply(new bigDecimal(-1))
            //             token_amount = value.getValue();
            //         }
            //     }

            } else if (event.name != "Swap" && event.name != "Transfer") {
                console.log("unknown event", event.name)
            }
        }
    }
    return {
        tx_hash: data.tx_hash,
        to_address,
        from_address,
        token_contract,
        token_amount,
        token_decimals,
        token_name,
    }
}