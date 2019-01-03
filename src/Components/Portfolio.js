import React,{Component} from 'react';
import {Col,CardPanel,Table,Modal,Row,Input,Button,Icon} from 'react-materialize';
import { Chart } from "react-google-charts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AlphaVantage from '../Helpers/AlphaVantage';
import Moment from 'moment';
const alphaVantage = new AlphaVantage();
class Portfolio extends Component{
    constructor(){  
        super();
        this.state = {
            stockNameInput : '',  //Input from the create stock form
            quantityInput : '', // Input from the quantity input
            currency : 'dollar', //The current curency 
            showGraph : false, //Triggers the graph
            graphData : [], //Graph data to be filled for google graphs 
            startDate: null, //Start date from the form
            startDateMoment : null, //Start date moment object
            endDate : null, //End date from the form
            endDateMoment : null, //End date moment object
            graphLoading : false //true when the graph is loading
        }
        this.handleStartDateChange = this.handleStartDateChange.bind(this); //Required by the Date Input library
        this.handleEndDateChange = this.handleEndDateChange.bind(this);
    }
    async handleStartDateChange(date) {
        //This function is called when the date is changed in the select start date for graph input.
        var dateMoment = Moment(date);
        await this.setState({
          startDate: date,
          startDateMoment : dateMoment
        });
        //Recompute the graph values
        this.showGraph();
    }
    async handleEndDateChange(date) {
        //This function is called when the date is changed in the select end date for graph input.
        var dateMoment = Moment(date);
        await this.setState({
            endDate :date,
            endDateMoment : dateMoment
        });
        //Recompute the graph value
        this.showGraph();
    }
    updateStockNameInput = (e)=>{
        //Stock Name input handler for create stock form
        this.setState({
            stockNameInput : e.target.value
        });
    }
    updateQuantityInput = (e)=>{
        //Quantity input handler for create stock form
        this.setState({
            quantityInput : e.target.value
        })
    }
    addStock = async ()=>{
        //This function iscalled when the add form is submitted for adding stock
        if(!this.state.quantityInput){
            alert("Quantity must be specified");
        }
        //Call the addStock passed from the parent fucntion.
        if(await this.props.addStock(this.props.id,this.state.stockNameInput,parseInt(this.state.quantityInput))){
            alert("Stock created succesfully");
        }else{
            alert("Failed to create stock");
        }
    }
    calculateTotal = ()=>{
        //Calculate the value of all the stocks in this portfolio
        var total = 0;
        for(let i = 0; i < this.props.stocks.length; i++){
            total += this.props.stockValues[this.props.stocks[i].symbol] * this.props.stocks[i].quantity;
        }
        return total + '';
    }
    changeToEuro = ()=>{
        //Changes the currency state to euro.
        this.setState({
            currency : 'euro'
        });
    }
    changeToDollar = ()=>{
        //Changes the currenct state to dollars.
        this.setState({
            currency : 'dollar'
        });
    }
    showGraph = async ()=>{
        //Computes the graph values for google charts.
        //Set the graphLoading to true to show that the graph is loading in the UI
        this.setState({
            graphLoading : true
        });
        var date1 = this.state.startDateMoment;
        var date2 = this.state.endDateMoment;
        var useDailyTimeSeries = true;   //If dailyTimesSeries is false it will compute the weekly timeseries
        //If end date is vacant but start date is there, keep end date as current date
        if(date1!=null && date2 == null){
            date2 = Moment(new Date());
        }
        //if start date is vacant but end date is there use weeklyTimeSeries so as to get a bigger margin.(till 1980)
        if(date1 == null && date2 != null){
            useDailyTimeSeries = false;
        }      
        else if(date1 != null && date2 !=null){
            //If both are available, set to weekly time series if the difference in dates are more than 4 months.
            if(Math.abs(date1.diff(date2,'days')) > 4 * 30){
                useDailyTimeSeries = false;
            }
        }
        var stocks = this.props.stocks;
        //Convert the data recieved from API to google charts data format.
        var data = [["Stocks"]];
        for(var i = 0; i < stocks.length; i++){
            data[0].push(stocks[i].symbol);
            if(useDailyTimeSeries)
                var stockSeries = (await alphaVantage.getDailyTimeSeries(stocks[i].symbol)).data["Time Series (Daily)"];
            else    
                var stockSeries = (await alphaVantage.getWeeklyTimeSeries(stocks[i].symbol)).data["Weekly Adjusted Time Series"];
            if(!stockSeries){
                alert("Free API limit has expired. Please wait 1 minute");
                return; 
            }
            var pos = 1;
            for(var key in stockSeries){
                var date = Moment(key);
                //Filter to check if the date is before the startDate
                if(date1 != null && date.isBefore(date1)){
                    break;
                }
                //Filter to check if the date is after the endDate
                if(date2 != null && date.isAfter(date2)){
                    break;
                }
                //If its a new symbol create anoher column
                if(data.length == pos)
                {
                    data.push([key]);
                }
                data[pos].push(parseFloat(stockSeries[key]["4. close"]));
                pos++;
            }
        };
        //The data is originally in descending order of dates. convert to ascending
        //Get the headers
        var newData = [data[0]];
        //Get the body
        var fieldDatas = data.slice(1);
        //Reverse the body
        fieldDatas.reverse();
        //Combine the header and body
        var newData = newData.concat(fieldDatas);
        //Set the state.
        this.setState({
            showGraph : true,
            graphData : newData,
            graphLoading : false
        });
    }
    hideGraph = ()=>{
        //Hides the graph
        this.setState({
            showGraph : false
        });
    }
    render(){
        //Get props to loc
        var deleteStock = this.props.deleteStock;
        var portfolioId = this.props.id;
        var stockValues = this.props.stockValues;
        var euroExchangeRate = this.props.euroExchangeRate.toFixed(2);
        var currency = this.state.currency;
        return(        
            this.state.showGraph?(<div>
                <Button waves='light' onClick = {this.hideGraph}>Back</Button>
                {this.state.graphLoading?(
                    <div style={{width : '100%', height : '400px'}}>
                        <p>Graph is loading</p>
                    </div>
                ):(<Chart
                    chartType="LineChart"
                    data={this.state.graphData}
                    width="100%"
                    height="400px"
                    legendToggle
                />)}
                <div style={{width:'50vh', marginLeft : '40px', backgroundColor : '#ccf',padding:'30px'}}>
                    <h6>Filters</h6>
                    <p>Start Date</p>
                    <DatePicker
                        selected={this.state.startDate}
                        onChange={this.handleStartDateChange}
                    />
                    <p>End Date</p>
                    <DatePicker
                        selected={this.state.endDate}
                        onChange={this.handleEndDateChange}
                    />
                </div>
            </div>):(<Col s={12} m={5}>
                <CardPanel>
                {this.state.currency==='dollar'?<Button waves='light' onClick={this.changeToEuro}>Show in Euros</Button>:<Button waves='light' onClick={this.changeToDollar}>Show In Dollars</Button>}
                    <a onClick={()=>this.props.deletePortfolio(this.props.id)}><i className="material-icons red-text" style={{float:'right'}} >delete</i></a>
                    <h4>{this.props.title}</h4>                  
                    <Table hoverable={true} responsive={true} bordered={true}>
                        <thead>
                            <tr>
                                <th data-field="name">Name</th>
                                <th data-field="unitValue">Unit Value</th>
                                <th data-field="quantity">Quantity</th>
                                <th data-field="total">Total</th>
                                <th data-field="delete">Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                this.props.stocks.map(function(stock){
                                    return (
                                        <tr key={stock.id}>
                                            <td>{stock.symbol}</td>
                                            <td>{currency==='dollar'?'$': '€'}{currency==='dollar'?(stockValues[stock.symbol]*1.0).toFixed(2):(stockValues[stock.symbol]*euroExchangeRate).toFixed(2)}</td>
                                            <td>{stock.quantity}</td>
                                            <td>{currency==='dollar'?'$': '€'}{currency==='dollar'?(stock.quantity * stockValues[stock.symbol] * 1.0).toFixed(2):stock.quantity * (stockValues[stock.symbol]*euroExchangeRate).toFixed(2)}</td>
                                            <td>
                                                <a onClick={()=>deleteStock(portfolioId,stock.id)}><i className="material-icons red-text tiny">delete</i></a>
                                            </td>   
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                    </Table>
                    <h6>Total Value : {currency==='dollar'?'$': '€'}{currency==='dollar'?(this.calculateTotal()*1.0).toFixed(2):(this.calculateTotal()*euroExchangeRate).toFixed(2)}</h6>
                    <br />
                    <Modal header='Add Stock' bottomSheet
                        trigger={<a className="waves-effect waves-light btn-small"><i className="material-icons left">add</i>Add Stocks </a>}>
                        <Row>
                            <Input s={12} label="Stock Symbol" id="symbolName" onChange={this.updateStockNameInput} required />
                            <Input s={12} label="Quantity" id="quantity" onChange={this.updateQuantityInput} type="number" required />
                            <br/>
                            <Button waves='light' onClick={this.addStock}>Create<Icon right>send</Icon></Button>
                        </Row>
                        
                    </Modal>
                    <a className="waves-effect waves-light btn-small green lighten-1" onClick = {this.showGraph}>Show Graphs</a>     
                </CardPanel>
            </Col>)
        )
    }
};

export default Portfolio;