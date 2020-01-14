import axios from "axios";

function cryptophyl(apiaddress, option, onupdate)
{
    var helper = {};

    helper.data = [];
    helper.maxData = 0;
    helper.minData = 0;
    helper.minVolume = 0;
    helper.maxVolume = 0;
    helper.option = {...option};
    helper.fetching = false;

    helper.fetch = () => {
        if(helper.fetching === true) return false;

        helper.fetching = true;
        axios
          .get(apiaddress + "/products/" + helper.option.symbol === undefined ? "BCH-USDH" : helper.option.symbol + "/candles", {
            granularity: helper.option.period === undefined ? 60 : helper.option.period
          })
          .then(res => {
              console.log(res);
              helper.fetching = false;
          })
          .catch(err => {
              console.error("Error", err)
              helper.fetching = false;
            });
        return true;
    };

    helper.connect = () => {
        helper.fetch();
        setTimeout(helper.connect(), 1000);
    };

    return helper;
}