/*
    This is the helper calss for the AlphaVantage API
*/
import constants from '../Constants';
import Axios from 'axios';

class AlphaVantage{
    constructor(){
        //The base url for the API
        this.url = "https://www.alphavantage.co/query?";
    }
    getValue =  async function(symbol){
        //This function fetches the current value of that stock
        var  data = await Axios.get(this.url + "function=" + constants.FUNCTION_TIME_SERIES +  '&apikey=' + constants.ALPHA_VANTAGE_KEY + '&symbol='+symbol);
        if(data.data["Error Message"]){
            return false;
        }
        for(var firstKey in data.data["Time Series (Daily)"]) break;
        return parseFloat(data.data["Time Series (Daily)"][firstKey]["5. adjusted close"]).toFixed(2);
    }
    getEuroEchangeRate = async function(){
        //Fetches the forex exchange rate for dollar to eur
        var data = await Axios.get("https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=EUR&apikey=11OITLZ6A9F4BGOE");
        if(data.data["Error Message"]){
            return false;
        }
        return parseFloat(data.data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);
    }
    getDailyTimeSeries = function(symbol) {
        //Returns the daily time series for a symbol
        return Axios.get(this.url + "function=TIME_SERIES_DAILY_ADJUSTED&apikey=" + constants.ALPHA_VANTAGE_KEY_1 + '&symbol=' + symbol);
    }
    getWeeklyTimeSeries = function(symbol) {
        //Returns the weekly times series for a symbol
        return Axios.get(this.url + "function=TIME_SERIES_WEEKLY_ADJUSTED&apikey=" + constants.ALPHA_VANTAGE_KEY_2 + '&symbol=' + symbol);
    }
}

export default AlphaVantage;