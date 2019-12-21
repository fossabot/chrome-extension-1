import React, { Component } from 'react';
import _map from 'lodash/map';
import _orderBy from 'lodash/orderBy';
import LoaderTabs from '../loader/loader-tabs.component';
import Error from '../error.component';
import { connect } from 'react-redux';
import { getMockData } from '../../mocks/tfl-bus.mocks';
import { FETCH_CONTENT } from '../../actions/types';

export class TflBus extends Component {
    constructor (props) {
        super(props);
        this.PROPERTIES = {
            feedUrl: "https://api.tfl.gov.uk/StopPoint/490008296G/arrivals",
            needsJsonParse: true
        }
        this.MAX_BUSES = 5;
        this.state = {
            contentReady: false,
            busDataLeft: [],
            busDataRight: [],
            error: false
        };
    }

    processData = function(feedData) {
        const self = this;
        try {
            self.setState(state => {
                const sortedList = _orderBy(feedData, ['timeToStation'],['asc']);
                state.busDataLeft = sortedList.slice(0, this.MAX_BUSES);
                state.busDataRight = sortedList.slice(this.MAX_BUSES, this.MAX_BUSES*2);
                state.contentReady = true;
                return state;
            });
        }
        catch(exception) {
            state.error = true;
            return state;
        }
    }

    componentDidMount() {
        if (this.props.mocksEnabled) {
            this.processData(getMockData())
        }
        else {
            chrome.runtime.sendMessage(
                { contentScriptQuery: FETCH_CONTENT, properties: this.PROPERTIES},
                feedData => this.processData(feedData));
        }
    }

    render() {
        if (!this.state.contentReady) {
            return (
                <LoaderTabs/>
            );
        }
        else if (this.state.error) {
            return (
                <Error/>
            );
        }
        else {
            return (
                <div className="tfl-bus-container">
                    <div className="bus-stop-title">
                        <a href="https://tfl.gov.uk/bus/stop/490008296G/seven-sisters-road-parkhurst-road?" target="_blank">
                            <span className="bus-stop-letter"> G</span>
                            <span className="bus-stop-name">Seven Sisters Road / Parkhurst Road</span>
                        </a>
                    </div>
                    <div className="bus-left">
                        {_map(this.state.busDataLeft, (bus, i) => {    
                            const timeToStation = Math.round(bus.timeToStation/60);
                            return (
                                <div className="bus" key={i}>
                                    <img src={chrome.runtime.getURL('../assets/bus.png')}/> 
                                    <div className="lineName">{bus.lineName}</div>
                                    <div className="expected-arrival">{timeToStation > 0 ? `${timeToStation} min`: 'Due'}</div>
                                </div>
                            )
                        })}

                    </div>
                    <div className="bus-right">
                        {_map(this.state.busDataRight, (bus, i) => {   
                            const timeToStation = Math.round(bus.timeToStation/60);
                            return (
                                <div className="bus" key={i}>
                                    <img src={chrome.runtime.getURL('../assets/bus.png')}/> 
                                    <div className="lineName">{bus.lineName}</div>
                                    <div className="expected-arrival">{timeToStation > 0 ? `${timeToStation} min`: 'Due'}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            );
        }
    }    
}
function mapStateToProps(state) {
	return {
		mocksEnabled: state.configuration.mocksEnabled
	};
}

export default connect(mapStateToProps)(TflBus);