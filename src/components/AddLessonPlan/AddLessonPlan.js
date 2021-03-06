import React, { Component } from "react";
import { store } from "../base.js";
import firebase from "firebase";
import { Input, Modal, Button, Table, Select, Popconfirm } from "antd";
import update from "immutability-helper";
import { DragDropContext } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import "./AddLessonPlan.css";
import LessonFiles from "./LessonFiles";
import Folders from "./Folders";
import { HashLoader } from "react-spinners";

class AddLessonPlan extends Component {
  componentDidMount() {
    document.title = "Lesson Plan List";
    //Call Firestore for user lessons

    this.removeAuthListener = firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.setState({
          currentUserUID: user.uid,
        });
        store.listenToCollection(`users/${user.uid}/lessons`, {
          context: this,
          withIds: true,
          then(data) {
            this.setState({
              lessons: data,
            });
          },
        });
        store.listenToCollection(`users/${user.uid}/folders`, {
          context: this,
          withIds: true,
          then(data) {
            this.setState({
              folders: data,
            });
          },
        });
        store.listenToDoc(`users/${user.uid}/paths/Main`, {
          context: this,
          then(data) {
            if (Object.keys(data).length === 0) {
              store.addToCollection(
                `users/${user.uid}/paths`,
                { Lessons: [], Folders: {} },
                "Main",
              );
            }
            this.setState({ viewPaths: data, loading: false });
          },
          onFailure(err) {
            console.log(err);
          },
        });
        store.listenToCollection(`users/${user.uid}/Templates`, {
          context: this,
          withIds: true,
          then(data) {
            const newData = [];
            newData.push(
              <Select.Option key="No Template" value="No Template">
                No Template
              </Select.Option>,
            );
            data.forEach(each => {
              newData.push(
                <Select.Option value={each.id} key={each.id}>
                  {each.id}
                </Select.Option>,
              );
            });
            this.setState({
              templateData: newData,
            });
          },
        });
      } else {
        return null;
      }
    });
  }
  constructor() {
    super();
    this.state = {
      currentUserUID: "",
      visible: false,
      lessons: {},
      loading: true,
      templateChoice: "No Template",
    };
    this.lessonsList = this.lessonsList.bind(this);
    this.foldersList = this.foldersList.bind(this);
    this.openFolder = this.openFolder.bind(this);
  }

  lessonsList = values => {
    if (values !== undefined) {
      const result = [];
      values.forEach(value => {
        let lesson;
        for (let i in this.state.lessons) {
          if (this.state.lessons[i].id === value) {
            lesson = this.state.lessons[i];
          }
        }
        result.push({
          key: lesson.id,
          Title: lesson.lessonTitle,
          Date: lesson.date,
          type: lesson.type,
        });
      });
      return result;
    } else {
      return "";
    }
  };

  foldersList = values => {
    const result = [];
    if (values !== undefined) {
      Object.keys(values).forEach(value => {
        let children = [];
        if (values[value]["Lessons"][0] !== undefined) {
          children = children.concat(
            this.lessonsList(values[value]["Lessons"]),
          );
        }
        let folder;
        for (let i in this.state.folders) {
          if (this.state.folders[i].id === value) {
            folder = this.state.folders[i];
          }
        }
        result.push({
          key: folder.id,
          Title: folder.folderTitle,
          Date: /*`${folder.month} ${folder.day}, ${folder.year}`*/ "-",
          type: folder.type,
          child: [{ key: 2, Title: "hey", Date: "-", type: "folder" }],
        });
      });
      return result;
    } else {
      return null;
    }
  };

  openFolder = id => {
    if (id) {
      this.setState({
        paths: this.state.viewPaths["Folders"][id],
      });
    }
  };

  renderList(paths) {
    if (paths) {
      if (Object.keys(paths).length !== 0) {
        let dataSource = [];
        dataSource = dataSource.concat(this.foldersList(paths["Folders"]));
        dataSource = dataSource.concat(this.lessonsList(paths["Lessons"]));
        const columns = [
          {
            title: "Name",
            dataIndex: "Title",
            key: "Title",
            //Render button and find record for cell
            render: (text, record) => {
              switch (record.type) {
                case "lesson":
                  return (
                    <LessonFiles
                      id={record.key}
                      text={text}
                      uid={this.state.currentUserUID}
                    />
                  );
                case "folder":
                  return (
                    <Folders
                      openFolder={this.openFolder}
                      text={text}
                      id={record.key}
                    />
                  );
                default:
                  return null;
              }
            },
          },
          {
            title: "Lesson Date",
            dataIndex: "Date",
            key: "Date",
            width: "20%",
          },
          {
            title: "Remove",
            key: "Remove",
            width: "5%",
            render: (text, record) => {
              return (
                <Popconfirm
                  title="Are you sure want to delete this item?"
                  onConfirm={() => {
                    const paths = this.state.viewPaths;

                    paths.Lessons = paths.Lessons.filter(
                      each => each !== record.key,
                    );
                    store
                      .updateDoc(
                        `users/${this.state.currentUserUID}/paths/Main`,
                        paths,
                      )
                      .then(data =>
                        store.removeDoc(
                          `users/${this.state.currentUserUID}/lessons/${
                            record.key
                          }`,
                        ),
                      );
                  }}
                >
                  <button
                    style={{
                      backgroundColor: "transparent",
                      border: "0px",
                      width: "100%",
                      height: "57px",
                      textAlign: "center",
                    }}
                  >
                    <i className="fas fa-trash fa-lg" />
                  </button>
                </Popconfirm>
              );
            },
          },
        ];
        return (
          <div>
            <Table
              expandRowByClick={true}
              rowClassName="Table_Row"
              dataSource={dataSource}
              columns={columns}
            />
          </div>
        );
      }
    }
  }

  handleAdd = type => {
    //Date variables
    const nowDate = new Date();
    const locale = "en-us";
    const month = nowDate.toLocaleString(locale, { month: "long" });
    const date =
      nowDate.getDate() +
      "/" +
      (nowDate.getMonth() + 1) +
      "/" +
      nowDate.getFullYear();
    const fullDate =
      month + " " + nowDate.getDate() + ", " + nowDate.getFullYear();
    let data;
    switch (type) {
      case "Lesson": {
        this.setState({
          visible: false,
        });
        data = {
          author_id: this.state.currentUserUID,
          lessonTitle: this.state.lessonTitle,
          date: fullDate,
          shortDate: date,
          year: nowDate.getFullYear(),
          month: month,
          day: nowDate.getDate(),
          type: "lesson",
        };
        this.state.templateChoice === "No Template"
          ? //API call
            store
              .addToCollection(
                `users/${this.state.currentUserUID}/lessons`,
                data,
              )
              .then(data => {
                const paths = this.state.viewPaths;
                paths["Lessons"].push(data.id);
                store.updateDoc(
                  `users/${this.state.currentUserUID}/paths/Main`,
                  paths,
                );
              })
              .catch(err => {
                //handle error
              })
          : store
              .get(
                `users/${this.state.currentUserUID}/Templates/${
                  this.state.templateChoice
                }`,
                {
                  context: this,
                },
              )
              .then(templateData => {
                data = Object.assign(templateData, data);
              })
              .then(newD => {
                store
                  .addToCollection(
                    `users/${this.state.currentUserUID}/lessons`,
                    data,
                  )
                  .then(data => {
                    const paths = this.state.viewPaths;
                    paths["Lessons"].push(data.id);
                    store.updateDoc(
                      `users/${this.state.currentUserUID}/paths/Main`,
                      paths,
                    );
                  })
                  .catch(err => {
                    //handle error
                  });
              });

        break;
      }
      case "Folder": {
        this.setState({
          visible: false,
        });

        data = {
          author_id: this.state.currentUserUID,
          folderTitle: this.state.lessonTitle,
          date: fullDate,
          shortDate: date,
          year: nowDate.getFullYear(),
          month: month,
          day: nowDate.getDate(),
          type: "folder",
        };

        //API call
        store
          .addToCollection(`users/${this.state.currentUserUID}/folders`, data)
          .then(data => {
            const paths = this.state.viewPaths;
            update(paths, {
              paths: {
                Folders: {
                  $merge: { [data.id]: { Folders: {}, Lessons: [] } },
                },
              },
            });
            console.log(paths);
            store.updateDoc(
              `users/${this.state.currentUserUID}/paths/Main`,
              paths,
            );
          })
          .catch(err => {
            //handle error
          });
        break;
      }
      default:
        return null;
    }
    this.setState({
      lessonTitle: "",
      templateChoice: "No Template",
    });
  };

  render() {
    const loading =
      this.state.loading === true ? (
        <div style={{ marginTop: "200px", marginBottom: "380px" }}>
          <div style={{ margin: "0px auto", width: "50px" }}>
            <HashLoader color="#1890ff" loading={this.state.loading} />
          </div>
          <h1
            style={{ textAlign: "center", color: "#1890ff", marginTop: "20px" }}
          >
            Loading...
          </h1>
        </div>
      ) : (
        this.renderList(this.state.viewPaths)
      );
    const showModal = this.state.visible ? (
      <Modal
        title={`Create a ${this.state.type}`}
        visible={this.state.visible}
        onCancel={() => this.setState({ visible: false })}
        footer={[
          <Button key="back" onClick={() => this.setState({ visible: false })}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={this.handleAdd.bind(this, this.state.type)}
          >
            Create
          </Button>,
        ]}
      >
        <h4>Create from template?</h4>
        <Select
          allowClear={true}
          style={{ minWidth: "300px" }}
          onChange={value => {
            this.setState({ templateChoice: value });
          }}
        >
          {this.state.templateData}
        </Select>
        <hr style={{ marginTop: "5px", marginBottom: "5px" }} />
        <h4>Input Title</h4>
        <Input
          placeholder="Input title"
          value={this.state.lessonTitle}
          onChange={e => this.setState({ lessonTitle: e.target.value })}
          onPressEnter={this.handleAdd.bind(this, this.state.type)}
        />
      </Modal>
    ) : null;
    return (
      <div>
        {loading}
        {/*Add a lesson plan*/}
        <Button
          type="primary"
          onClick={() => this.setState({ visible: true, type: "Lesson" })}
        >
          Add a lesson plan
        </Button>
        {/*<Button
          style={{ marginLeft: "20px" }}
          type="primary"
          onClick={() => this.setState({ visible: true, type: "Folder" })}
        >
          Add a folder
        </Button>*/}
        {showModal}
      </div>
    );
  }
}

export default DragDropContext(HTML5Backend)(AddLessonPlan);
