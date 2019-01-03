import React,{Component} from 'react';
import Portfolio from './Portfolio';
import {Row} from 'react-materialize';
class Portfolios extends Component{
    /*
        Portfolios component holds hold the portfolios. 
    */
    render(){
        //Get the props to local variables so that it can be acessed below.
        var addStock = this.props.addStock;
        var deletePortfolio = this.props.deletePortfolio;
        var deleteStock = this.props.deleteStock;
        var stockValues = this.props.stockValues;
        var euroExchangeRate = this.props.euroExchangeRate;
        return( 
            <div>
                <Row>
                    {
                        this.props.portfolios.map(function(portfolio){
                            return  (<Portfolio title={portfolio.title} key={portfolio.id} id={portfolio.id} stocks={portfolio.stocks} addStock={addStock} deletePortfolio={deletePortfolio} deleteStock={deleteStock} stockValues={stockValues} euroExchangeRate={euroExchangeRate}/>)
                        })
                    }
                </Row>  
            </div>
        )
    }
};

export default Portfolios;