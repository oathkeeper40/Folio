import React, { Component } from "react";
import { Switch, Route } from "react-router-dom";
import LoginPage from "./LoginPage.js";
import Testpage from "./Testpage";
import AddLessonPlan from "./AddLessonPlan/AddLessonPlan.js";
import { app } from "./base";
import Home from "./Home";
import MainChecklist from "./Checklist Quiz/MainChecklist.js";

class Main extends Component {
  constructor() {
    super();
    this.state = {
      currentUser: null,
      authenticated: false,
      loading: true,
    };
    this.setCurrentUser = this.setCurrentUser.bind(this);
  }
  componentDidMount() {
    this.removeAuthListener = app.auth().onAuthStateChanged(user => {
      if (user) {
        this.setState({
          authenticated: true,
          currentUser: user,
          loading: false,
        });
      } else {
        this.setState({
          authenticated: false,
          currentUser: null,
          loading: false,
        });
      }
    });
  }

  componentWillUnmount() {
    this.removeAuthListener();
  }

  setCurrentUser(user) {
    if (user) {
      this.setState({
        currentUser: user,
        authenticated: true,
        loading: false,
      });
    } else {
      this.setState({
        currentUser: null,
        authenticated: false,
        loading: false,
      });
    }
  }
  render() {
    return (
      <main>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/testpage" component={Testpage} />
          <Route
            exact
            path="/login"
            render={props => {
              return (
                <LoginPage setCurrentUser={this.setCurrentUser} {...props} />
              );
            }}
          />
          <Route exact path="/lessonplanlist" component={AddLessonPlan} />
          <Route exact path="/checklist" component={MainChecklist} />
        </Switch>
      </main>
    );
  }
}
export default Main;
