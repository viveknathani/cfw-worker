const configuration     = require('../config');
const Twit              = require('twit');
const {google}          = require('googleapis');
const twitConfig        = new Twit(configuration.twitter);

const client = new google.auth.JWT(
    configuration.sheets.client_email, null, 
    configuration.sheets.private_key, 
    configuration.scope
);

const callbackFunction = function(err, data, response) 
{
    if(err)
    {
        console.log(err);
    }
}

async function run(creds)
{
    const sheetsAPI = google.sheets({ version: 'v4', auth: creds});
    
    let result = await sheetsAPI.spreadsheets.values.get(
                { 
                    spreadsheetId: configuration.spreadsheetId, 
                    range: 'Sheet1!A2:C720'
                });

    let dataArray = result.data.values;
    let tweet = { status : 'Hello World!' };
    let couldFind = false;
    for(let i = 0; i < dataArray.length; ++i)
    {
        if(dataArray[i][1] === 'no')
        {
            tweet.status = dataArray[i][0];
            dataArray[i][1] = 'yes';
            couldFind = true;
            break;
        }
    }

    if(couldFind)
    {
        twitConfig.post('statuses/update', tweet, callbackFunction);
        let updatedResult = await sheetsAPI.spreadsheets.values.update(
                           {
                               spreadsheetId: configuration.spreadsheetId, 
                               range: 'Sheet1!A2:C720', 
                               valueInputOption: 'USER_ENTERED', 
                               resource: {values: dataArray}
                           });
        console.log(updatedResult.status);
    }
    else 
    {
        console.log('Polled and found nothing.');
    }

}

function job()
{
    client.authorize(function(err, tokens)
    {
        if(err)
        {
            console.log(err);
            return;
        }
        run(client)
            .catch((err) => console.log(err))
            .then(() =>  {});
    });
}

setInterval(job, 1000 * 60);