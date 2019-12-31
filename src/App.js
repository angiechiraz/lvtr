import React from "react";
import "./App.css";
import Loading from "./components/Loading/Loading";
import Menu from "./components/Menu/Menu";
import { store, setStatus } from "./redux/app-redux";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.changeStatus = this.changeStatus.bind(this);
    this.state = {
      status: "menu"
    };
  }
  changeStatus() {
    store.dispatch(setStatus("loading"));
    this.setState({ status: "loading" });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          {this.state.status === "loading" ? (
            <Loading />
          ) : (
            <Menu startSim={this.changeStatus} />
          )}
        </header>
      </div>
    );
  }
}

export default App;
