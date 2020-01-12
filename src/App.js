import React from "react";
import "./App.css";
import Loading from "./components/Loading/Loading";
import Menu from "./components/Menu/Menu";
import Results from "./components/Results/Results";
import { store, setStatus } from "./redux/app-redux";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.changeStatus = this.changeStatus.bind(this);
    this.state = {
      status: "menu"
    };
  }

  changeStatus(status) {
    store.dispatch(setStatus(status));
    this.setState({ status: status });
  }

  render() {
    return (
      <div className="App">
        <p className="top-left">LVTR</p>
        <header className="App-header">
          {this.state.status === "loading" ? (
            <Loading changeStatus={this.changeStatus} />
          ) : this.state.status === "menu" ? (
            <Menu startSim={this.changeStatus} />
          ) : (
            <Results startSim={this.changeStatus} />
          )}
        </header>
      </div>
    );
  }
}

export default App;
