import React from 'react';
import Chart from "react-apexcharts";
import crypto from "./../modules/cryptophyl";
import ChartsToolbar from "../toolbar/exchangetoolbar";

var  crypto_helper;

class CryptophylCharts extends React.Component{
    constructor(props)
    {
        super(props);

        this.onUpdate = this.onUpdate.bind(this);
        this.onPeriodType = this.onPeriodType.bind(this);

        this.state = {
            exchange_option: {
                symbol: "BCHUSD",
                period: "M30"
            },
            series: [],
            options:{
                noData: {
                    text: 'Loading ... ',
                },
                chart: {
                    height: 350,
                    type: 'line',
                    toolbar: {
                        show: true,
                        tools: {
                            pan: false,
                            reset: false,
                            customIcons: [
                            ]
                        }
                    }
                },
                legend: {
                    show: false,
                },
                tooltip: {
                    shared: true,
                    custom: [ 
                        function({seriesIndex, dataPointIndex, w})
                        {
                            const o = w.globals.seriesCandleO[seriesIndex][dataPointIndex]
                            const h = w.globals.seriesCandleH[seriesIndex][dataPointIndex]
                            const l = w.globals.seriesCandleL[seriesIndex][dataPointIndex]
                            const c = w.globals.seriesCandleC[seriesIndex][dataPointIndex]
                            //console.log(w.globals.seriesCandleC[seriesIndex][w.globals.seriesCandleC.length - 1]);
                            return (
                                '<div class="apexcharts-tooltip-candlestick">' +
                                    '<div>Open: <span class="value">' +
                                    o +
                                    '</span></div>' +
                                    '<div>High: <span class="value">' +
                                    h +
                                    '</span></div>' +
                                    '<div>Low: <span class="value">' +
                                    l +
                                    '</span></div>' +
                                    '<div>Close: <span class="value">' +
                                    c +
                                    '</span></div>' +
                                    '<div>Volume: <span class="value">' +
                                    w.globals.series[1][dataPointIndex] +
                                    '</span></div>' +
                                '</div>'
                            );
                        },
                        function()
                        {
                            return "";
                        }
                    ]
                },
                xaxis: {
                    type: 'datetime'
                },
                yaxis: [
                    {
                        seriesName: 'candle',
                        axisTicks: {
                            show: true
                        },                    
                        min: this.getMinData,
                        max: this.getMaxData,
                        title: {
                            text: "OHLC DATA",
                            style: {
                                color: "#FEB019",
                            }
                        }
                    },
                    {
                        seriesName: 'volume',
                        axisTicks: {
                            show: true
                        },      
                        opposite: true,              
                        min: this.getMinVolume,
                        max: this.getMaxVolume,
                        title: {
                            text: "Volume DATA",
                            style: {
                                color: "#FEB019",
                            }
                        }
                    }
                ]
            }
        };


        crypto_helper = crypto("wss://api.exchange.bitcoin.com/api/2/ws",
                            this.state.exchange_option,
                            null, 
                            this.onUpdate, 
                            null);
        crypto_helper.connect();
    }

    getMinData()
    {
        return crypto_helper.minData;
    }

    getMaxData()
    {
        return crypto_helper.maxData;
    }
    
    getMinVolume()
    {
        return crypto_helper.minVolume;
    }

    getMaxVolume()
    {
        return crypto_helper.maxVolume * 3;
    }

    onUpdate(data) {
                
        //newOptions.yaxis[0].title.text = "New Text";
        let d = data.map(item => {
            return {x: item.x, y: [item.y[0], item.y[1], item.y[2], item.y[3]]};
        });
        let volumes = data.map(item => {
            return {x: item.x, y: item.y[4]};
        })

        this.setState({
            series: [
            {
                name: "candle",
                type: "candlestick",
                data: d
            },
            {
                name: 'volume',
                type: 'column',
                data: volumes
            }]
        });

        console.log(Math.random() * 0.00000001);
        
        this.setState((state) => ({
            options: {
                ...state.options,
                yaxis: [
                    {
                        ...state.options.yaxis[0]
                    },
                    {
                        ...state.options.yaxis[1]                  
                    }
                ]
            }
        }))
        
    }

    onPeriodType(period)
    {
        this.setState((state) => ({
            exchange_option: {
                ...state.exchange_option,
                period: period
            }
        }));

        crypto_helper.close();
        crypto_helper.option.period = period;
        crypto_helper.connect();
    }

    render()
    {
        return (
            <div>
                <ChartsToolbar title="Exchange Trade Data BCH/USD" onClick={this.onPeriodType} default="M30" selected={this.state.exchange_option.period}></ChartsToolbar>
                <div id="chart">
                <Chart options={this.state.options} series={this.state.series} type="line" height={350} />
                </div>
                <div id="html-dist"></div>
            </div>
            
        )
    }
}

export default CryptophylCharts;