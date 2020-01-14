
function exchange(apiaddress, option, onopen = null, onmessage = null, onclose = null)
{
    var helper = {};
    helper.ws = null;
    helper.data = [];
    helper.maxData = 0;
    helper.minData = 0;
    helper.minVolume = 0;
    helper.maxVolume = 0;
    helper.connecting = false;
    /**
     * required field: symbol, period
     */
    helper.option = {...option};

    helper.connect = () => {
        if(helper.connecting === true)
            return false;
        helper.ws = new WebSocket(apiaddress);

        helper.ws.onopen = helper.onopen;
        helper.ws.onmessage = helper.onmessage;
        helper.ws.onclose = helper.onclose;
        
        helper.connecting = true;
        return true;
    };

    // on websocket open
    helper.onopen = () => {
        if(helper.ws.readyState === 1)
            helper.ws.send(JSON.stringify({ 
                "method": "subscribeCandles",
                "params": {
                "symbol": helper.option.symbol === undefined ? "ETHBTC" : helper.option.symbol,
                "period": helper.option.period === undefined ? "M10" : helper.option.period,
                "limit": 100
                },
                "id": 123
            }));
        if(onopen !== null)
            onopen();

            
        
    };

    helper.close = () => {
        if(helper.ws.readyState === 1)
            helper.ws.send(JSON.stringify({ 
                "method": "unsubscribeCandles",
                "params": {
                "symbol": helper.option.symbol === undefined ? "ETHBTC" : helper.option.symbol,
                "period": helper.option.period === undefined ? "M10" : helper.option.period,
                "limit": 100
                },
                "id": 123
            }));
    };

    // on websocket receive message
    helper.onmessage = (message) => {
        helper.connecting = false;

        console.log(message);
        let data = JSON.parse(message.data);
        switch(data.method)
        {
        case "snapshotCandles":
            helper.updateInitData(data.params.data);
            break;
        case "updateCandles":
            helper.updateData(data.params.data);
            break;
        default: 
            break;
        }
        if(onmessage !== null && helper.data.length !== 0)
            onmessage(helper.data);
    };

    // on websocket closed with some reason
    helper.onclose = () => {
        helper.connecting = false;
        helper.waitForSocketConnection();   
        if(onclose !== null)
            onclose();

    };

    helper.updateInitData = (newData) => {
        helper.data = newData.map((item, index) => {
            item.open   = parseFloat(item.open);
            item.max    = parseFloat(item.max);
            item.min    = parseFloat(item.min);
            item.close  = parseFloat(item.close);
            item.volume = parseFloat(item.volume);

            if(index === 0 || helper.maxData < item.max) helper.maxData = item.max;
            if(index === 0 || helper.minData > item.min) helper.minData = item.min;
            if(index === 0 || helper.minVolume > item.volume) helper.minVolume = item.volume;
            if(index === 0 || helper.maxVolume < item.volume) helper.maxVolume = item.volume;

            return { 
                x: new Date(item.timestamp),
                y: [item.open, item.max, item.min, item.close, item.volume]
            };
        });

        return helper.data;
    };

    helper.updateData = (newData) => {
        newData.map(item => {
            let data = helper.data.find(element => element.x.toString() === new  Date(item.timestamp).toString());

            item.open   = parseFloat(item.open);
            item.max    = parseFloat(item.max);
            item.min    = parseFloat(item.min);
            item.close  = parseFloat(item.close);
            item.volume = parseFloat(item.volume);

            if(helper.maxData < item.max) helper.maxData = item.max;
            if(helper.minData > item.min) helper.minData = item.min;

            if(data === undefined)
            {
                helper.data.push({
                    x: new Date(item.timestamp),
                    y: [item.open, item.max, item.min, item.close, item.volume]
                });
            }
            else
            {
                data.y = [item.open, item.max, item.min, item.close, item.volume];
            }

            return item;
        });

        return helper.data;
    };

    helper.waitForSocketConnection = () => {
        if(helper.ws.readyState !== 1)
        {
            helper.connect();
            setTimeout(helper.waitForSocketConnection, 1000);
        }
        
    };

    return helper;
}

export default exchange;