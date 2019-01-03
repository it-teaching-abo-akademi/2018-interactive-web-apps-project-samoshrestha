import React, { Component } from 'react';
import {Modal,Row,Input,Button,Icon} from 'react-materialize';
import Header from './Components/Header';
import Portfolios from './Components/Portfolios';
import AlphaVantage from './Helpers/AlphaVantage';
import constants from './Constants';
const randomstring = require("randomstring");
var alphaVantage = new AlphaVantage();
class App extends Component {
  //This is the main class
  constructor(){
    super();
    this.state = {
      portfolioNameInput : null,   //This gets updated when a user starts typing the portfolio name in create portfolio popup
      portfolios : [], // This stores the list of portfolio. Each portfolio will contain a list of stocks inside it.
      stockValues : {}, // This is a cache based system which will compute all the stock values when the user opens the website or adds a new stock.
      euroExchangeRate : 0 //This gets updated when the user opens the website.
    };
    //Get the portfolios stored in the localstorage and set it to state if it exists
    var portfolios = localStorage.getItem("portfolios");  
    if(portfolios)
      this.state.portfolios = JSON.parse(portfolios);
    //Compute stock prices for all symbols in portfolios
    this.computeStockPrices();
    //Gets the euro rate and updates the state.
    this.getEuroRate();
  }
  componentDidUpdate(){
    //Update the localstorage if anything in the state changes.
    localStorage.setItem('portfolios',JSON.stringify(this.state.portfolios));
  }
  getEuroRate = async ()=>{
    //This function fetches the euro rate and updates the state.
    var euroRate = await alphaVantage.getEuroEchangeRate();
    if(euroRate){
      this.setState({
        euroExchangeRate : euroRate
      });
    }else{
      alert("Failed to fetch euro exchange rate"); 
    }
  }
  computeStockPrices = async ()=>{
    //This function finds all the stock prices and updates the state
    for(let i = 0; i < this.state.portfolios.length; i++){
      for(let j=0;j < this.state.portfolios[i].stocks.length; j++){
          var value = await alphaVantage.getValue(this.state.portfolios[i].stocks[j].symbol);
          var stockValues = this.state.stockValues;
          stockValues[this.state.portfolios[i].stocks[j].symbol] = value;
          this.setState({
            stockValues 
          });
      }
    }
  }
  addPortfolio = (e)=>{
    //This function adds a portfolio to the state
    //If the maximum portfolops have reached alert the user
    if(this.state.portfolios.length === constants.MAX_PORTFOLIO){
      alert("You cannot create anymore portfolios");
    }
    else{
      //Add portfolio to state.
      if(this.state.portfolioNameInput)
      {
        var portfolioName = this.state.portfolioNameInput;
        this.setState({
          portfolios : [...this.state.portfolios,{
            id : randomstring.generate(),
            title : portfolioName,
            stocks : []
          }]
        },function(){
          alert("Portfolio has been created");
        });
      }
      else  
        alert("Portfolio Name cant be empty");
    }
  }
  deleteStock = (portfolioId,stockId)=>{
    //This function takes in the portfolioId and the stockId of the stock to be deleted
    var portfolios = this.state.portfolios;
    for(let i = 0; i < portfolios.length; i++){
      //Find the portfolio in which the stock is
      if(portfolios[i].id === portfolioId){
        var stocks = this.state.portfolios[i].stocks;
        //Find the stock in that portfolio
        for(let j = 0; j < stocks.length; j++){
          if(stocks[j].id === stockId){
            //Delete that stock
            stocks.splice(j,1);
            portfolios[i].stocks = stocks;
            this.setState({
              portfolios : portfolios
            });
            break;
          }
        }
        break;
      }
    }
  }
  deletePortfolio = (portfolioId)=>{
    var portfolios = this.state.portfolios;
    //Find the portfolio with the id
    for(let i = 0; i < portfolios.length; i++){
      if(portfolios[i].id === portfolioId){
        //Delete that portfolio
        portfolios.splice(i,1)
        this.setState({
          portfolios : portfolios 
        });
        break;
      }
    }
  }

  updatePortfolioNameInput = (e)=>{
    //This is binded to the create portfolio name input. updates the state
    this.setState({
      portfolioNameInput : e.target.value
    });
  }
  addStock = async (portfolioId,stockName,quantity)=>{
    //This function adds a stock of stockName and quantity to portfolio with portfolioId
    //Get the value of the stock from the api.
    var value = await alphaVantage.getValue(stockName);
    var stockValues = this.state.stockValues;
    stockValues[stockName.toUpperCase()] = value;
    this.setState({
      stockValues 
    });
    //If the value of the stock was not fetchable alert the user
    if(!value){
      alert("Invalid Symbol")
      return false;
    }else{
      //If value is found add the stock to the portfolio
      let portfolios = this.state.portfolios;
      for(var i = 0; i < portfolios.length; i++){
        if(portfolios[i].id === portfolioId){
          if(portfolios[i].stocks.length === constants.MAX_SYMBOLS){
            alert("Cannot create anymore stocks in this portfolio");
            return false;
          }
          portfolios[i].stocks.push({id : randomstring.generate(),symbol : stockName.toUpperCase(),value : value, quantity: quantity});
          this.setState({
            portfolios
          });
        }
      } 
    }
    return true;
  }
  render() {
    return (
      <div className="App">
        <Header />
        <Modal header='Add Portfolio' bottomSheet id="createPortfolio"
          trigger={<a href="#portfolioForm" className="btn-floating btn-large waves-effect waves-light red pulse" style={{position : 'fixed',bottom : '10%', right : '10%' }}><i className="material-icons">add</i></a>}>
          <Row>
            <Input s={12} label="Portfolio Name" id="portfolioName" onChange={this.updatePortfolioNameInput} required />
            <br/>
            <Button waves='light' onClick={this.addPortfolio}>Create<Icon right>send</Icon></Button>
          </Row>
          
        </Modal>
          
        <Portfolios portfolios={this.state.portfolios} addStock={this.addStock} deletePortfolio={this.deletePortfolio} deleteStock={this.deleteStock}  stockValues={this.state.stockValues} euroExchangeRate={this.state.euroExchangeRate}/>
      </div>
    );
  }
}

export default App;
