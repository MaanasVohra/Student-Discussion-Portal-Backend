var express = require('express'), // backend framework to handle the requests
    app = express(),
    mysql = require('mysql'), // mysql package for database functionality
    bodyParser = require('body-parser'), // parsing the data got from the request
    async = require('async'),
    axios = require('axios');


// CORS functionality
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

// Database functionality
// change this for different systems
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "xxxx",
    database: "soe_project"
});

// connection to the database
con.connect(function (err) {
    if (err) throw err;
    console.log("Connected to the database!");
});

// Body Parser config 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//==================================
//      GET REQUESTS
//==================================

app.get("/", function (req, res) {
    res.send("This works");
});

//----------------
// COMMENTS
//----------------

// get all comments for a particular answer 
app.get("/api/comments", function (req, res) {
    const answerNumber = req.query.answerNumber;
    const sqlQuery = "select commentNumber, commentCreator, commentContent from comments where answerNumber = ?";
    const sqlQueryOptions = [answerNumber];

    con.query(sqlQuery, [sqlQueryOptions], function (err, result) {
        try {
            res.send(result);
        } catch (err) {
            res.send([]);
        }
    });
});

//----------------
// ANSWERS
//----------------

// get all the answers related to a particular question
app.get("/api/answers", function (req, res) {
    const questionNumber = req.query.questionNumber;
    const sqlQuery = "select answerCreator, answerContent, answerNumber from answers where questionNumber = ?";
    const sqlQueryOptions = [questionNumber];

    con.query(sqlQuery, [sqlQueryOptions], function (err, result) {
        try {
            res.send(result);
        } catch (err) {
            res.send([]);
        }
    });
});

//----------------
// QUESTIONS
//----------------

// get all questions to display on the dashboard 
// this is when the subtopic is clicked 
app.get("/api/questions", function (req, res) {
    let query = req.query;

    // the basic info consists of the heading, subheading and question creator 
    let getBasicInfo = query.getBasicInfo;

    // extract the subtopic name from the query
    let subtopicName = query.subtopicName;
    if (getBasicInfo === "true") {
        let sqlQuery = "select questionNumber, questionHeading, questionSubheading, questionCreator from questions where subtopicName = ?"
        let sqlQueryOptions = [subtopicName];

        con.query(sqlQuery, [sqlQueryOptions], function (err, result) {
            try {
                res.send(result);
            } catch (err) {
                console.log(err);
                res.send([]);
            }
        });
    } else {
        // return all the questions with all info, for now 
        return ("0");
    }

});

// get details of a particular question 
app.get("/api/questions/:questionNumber", function (req, res) {
    const questionNumber = req.params.questionNumber;
    const sqlQuery = "select * from questions where questionNumber = ?";
    const sqlQueryOptions = [questionNumber];

    // executing sql query
    con.query(sqlQuery, [sqlQueryOptions], function (err, result) {
        try {
            res.send(result[0]);
        } catch (err) {
            console.log(err);
            res.send("-1");
        }
    });

});

//----------------
// TOPICS
//----------------

// get all the topics, and subtopics if required
app.get("/api/topics", function (req, res) {
    let query = req.query;
    let getAllSubtopics = query.getAllSubtopics;

    if (getAllSubtopics === "true") {
        // return the topics with the subtopics
        let query = "select topics.topicName as topicName, subtopics.subtopicName as subtopicName from topics left join subtopics on topics.topicName = subtopics.topicName;";

        con.query(query, function (err, result, fields) {
            try {
                // this will lead to easier display on the dashboard sidenav
                modifiedResults = [];
                let i = 0;
                while (i < result.length) {
                    let resultObj = {};
                    resultObj.topicName = result[i].topicName;
                    if (result[i].subtopicName == null) {
                        resultObj.subtopics = [];
                    } else {
                        resultObj.subtopics = [result[i].subtopicName];
                    }
                    let j = i + 1;
                    while (j < result.length && result[j].topicName == result[i].topicName) {
                        resultObj.subtopics.push(result[j].subtopicName);
                        j++;
                    }
                    modifiedResults.push(resultObj);
                    i = j;
                }
                res.send(modifiedResults);

            } catch (err) {
                res.send("-1");
            }
        });
    } else {
        // just return all the topics
        res.send("0");
    }
});

//==================================
//      POST REQUESTS
//==================================

//----------------
// COMMENTS
//----------------

// creation of a new comment 
app.post("/api/comments", function (req, res) {

    // extract all values
    let insertedCommentValues = [];
    insertedCommentValues.push(req.body.commentCreator);
    insertedCommentValues.push(req.body.commentContent);
    insertedCommentValues.push(req.body.answerNumber);

    let insertedComments = [];
    insertedComments.push(insertedCommentValues);

    const sqlQuery = "insert into comments (commentCreator, commentContent, answerNumber) values ?";

    // executing sql query 
    con.query(sqlQuery, [insertedComments], function (err, result) {
        try {
            if (result) {
                res.send("1");
            } else {
                res.send("0");
            }
        } catch (err) {
            res.send("-1");
        }
    });
});

//----------------
// ANSWERS
//----------------

// creation of new answer
app.post("/api/answers", function (req, res) {

    // extract all values
    let insertedAnswerValues = [];
    insertedAnswerValues.push(req.body.answerCreator);
    insertedAnswerValues.push(req.body.answerContent);
    insertedAnswerValues.push(req.body.questionNumber);

    let insertedAnswers = [];
    insertedAnswers.push(insertedAnswerValues);

    let sqlQuery = "insert into answers (answerCreator, answerContent, questionNumber) values ?";

    // executing sql query
    con.query(sqlQuery, [insertedAnswers], function (err, result) {
        try {
            if (result) {
                res.send("1");
            } else {
                res.send("0");
            }
        } catch (err) {
            res.send("-1");
        }
    });
});

//----------------
// TOPICS
//----------------

// creation of a new topic
app.post("/api/topics", function (req, res) {
    let topicName = req.body.topicName,
        topicCreator = req.body.topicCreator;

    let insertedTopics = [], insertedTopicValues = [];
    insertedTopicValues.push(topicName);
    insertedTopicValues.push(topicCreator);
    insertedTopics.push(insertedTopicValues);

    let query = "insert into topics values ?";
    con.query(query, [insertedTopics], function (err, result) {
        try {
            if (result) {
                res.send("1"); //=> Creation of new topic
            } else {
                res.send("0"); //=> Duplicate topic entry 
            }
        } catch (err) {
            res.send("-1"); //=> Some error while creating topic
        }
    });
});

//----------------
// USER
//----------------

// creation of a new user
app.post("/api/users", function (req, res) {
    let newUser = req.body, insertedUser = [];
    let query = "insert into users values ?";

    // Extracting all property values from the request object
    temp = []
    for (var key in newUser) {
        if (newUser.hasOwnProperty(key)) {
            temp.push(newUser[key]);
        }
    }
    insertedUser.push(temp);

    // executing sql query
    con.query(query, [insertedUser], function (err, result) {
        try {
            if (result) {
                // console.log("New entry in user");
                res.send("1"); // 1 => successful entry in the database
            } else {
                // console.log("Duplicate entry in user");
                res.send("0"); // 0 => duplicate entry due to duplicate roll number
            }
        } catch (err) {
            // console.log("error while entry in user");
            res.send("-1");
        }
    });

});

//----------------
// SUBTOPIC
//----------------

// adding a new subtopic 
app.post("/api/subtopics", function (req, res) {
    let newSubtopic = req.body, insertedSubtopic = [];

    let subtopicName = "'" + newSubtopic.subtopicName + "'";
    let subtopicCreator = "'" + newSubtopic.subtopicCreator + "'";
    let topicName = "'" + newSubtopic.topicName + "'";
    let query = "insert into subtopics values (" + subtopicName + "," + subtopicCreator + "," + topicName + " );";

    // execute sql query 
    con.query(query, function (err, result) {
        try {
            if (result) {
                res.send("1"); // 1 => successful entry in database
            } else {
                res.send("0"); // 0 => duplicate entry in the database;
            }
        } catch (err) {
            res.send("-1"); // -1 => some error while executing the query
        }
    });

});

//----------------
// QUESTION
//----------------

// adding a new question
app.post("/api/questions", function (req, res) {

    // extracting all values 
    let insertedQuestionValues = [];
    insertedQuestionValues.push(req.body.questionCreator);
    insertedQuestionValues.push(req.body.subtopicName);
    insertedQuestionValues.push(req.body.questionHeading);
    insertedQuestionValues.push(req.body.questionSubheading);
    insertedQuestionValues.push(req.body.questionContent);

    insertedQuestions = [];
    insertedQuestions.push(insertedQuestionValues);

    let sqlQuery = "insert into questions (questionCreator, subtopicName, questionHeading, questionSubheading, questionContent) values ?";

    // executing sql query 
    con.query(sqlQuery, [insertedQuestions], function (err, result) {
        try {
            if (result) {
                res.send("1"); // successful entry in the database
            } else {
                res.send("0"); // some error while executing query
            }
        } catch (err) {
            res.send("-1"); // some error while executing the query 
        }
    });


});

// authenticate while login
app.post("/login", function (req, res) {
    let userRollNumber = req.body.userRollNumber;
    let userPassword = req.body.userPassword;
    let query = "select userRollNumber, userPassword from users where userRollNumber = " + "'" + userRollNumber + "'" + ";";

    // get the data from the database
    con.query(query, function (err, result, fields) {
        try {
            // console.log(query);
            if (result.length == 1) {
                let foundUserRollNumber = result[0].userRollNumber,
                    foundUserPassword = result[0].userPassword;
                if (userPassword === foundUserPassword) {
                    res.send("1");
                } else {
                    res.send("0");
                }
            } else {
                res.send("2");
            }
        } catch (err) {
            // console.log("Error while fetching user");
            res.send("-1");
        }
    });
});


//==================================
//      DELETE
//==================================

//--------------
//  COMMENTS
//--------------

// delete comment of particular comment number 
app.delete("/api/comments/:commentNumber", function (req, res) {
    const commentNumber = req.params.commentNumber;
    const sqlQuery = "delete from comments where commentNumber = ?";

    const sqlQueryOptions = [commentNumber];

    // executing query
    con.query(sqlQuery, [sqlQueryOptions], function (err, result) {
        try {
            if (result) {
                res.send("1");
            } else {
                res.send("0");
            }
        } catch (err) {
            res.send("-1");
        }
    });

});

//--------------
//  ANSWER
//--------------

// delete a particular answer
// (1) First delete all comments related to a particular answer (answer is a foreign key)
// (2) Then delete the answer

app.delete("/api/answers/:answerNumber", function (req, res) {
    const answerNumber = req.params.answerNumber;
    async.series([
        // first delete all comments with the answer number        
        function (callback) {
            const deleteCommentsQuery = "delete from comments where answerNumber = ?";
            const deleteCommentsQueryOptions = [answerNumber];
            con.query(deleteCommentsQuery, [deleteCommentsQueryOptions], function (err, result) {
                try {
                    if (result) {
                        callback(null, "Successfully deleted comments!");
                    } else {
                        callback(null, 'Error');
                    }
                } catch (err) {
                    callback(null, 'Serious error!');
                }
            });
        },
        // now delete the answer
        function (callback) {
            const deleteAnswerQuery = "delete from answers where answerNumber = ?";
            const deleteAnswerQueryOptions = [answerNumber];
            con.query(deleteAnswerQuery, [deleteAnswerQueryOptions], function (err, result) {
                try {
                    if (result) {
                        callback(null, "1");
                    } else {
                        callback(null, "0");
                    }
                } catch (err) {
                    callback(null, "-1");
                }
            });
        }
    ], function (err, results) {
        try {
            if (results) {
                res.send("1");
            } else {
                res.send("0");
            }
        } catch (err) {
            res.send("-1");
        }
    });

});

//--------------
//  QUESTIONS
//--------------

// delete a question for a particular id;
// (1) First delete all the comments for all the answers in the question
// (2) Then delete all the answers in the question
// (3) Then delete the question

app.delete("/api/questions/:questionNumber", function (req, res) {
    const questionNumber = req.params.questionNumber;
    let answerIdList = [];

    async.series([
        function (callback) {
            // fetch all answer ids
            const sqlQuery = `select answerNumber from answers where questionNumber=${questionNumber};`;
            con.query(sqlQuery, function (err, result) {
                answerIdList = result;
                callback(null, result);
            });
        },
        function (callback) {
            // for each answer id delete the answer
            async.each(answerIdList, function (answerId, callback1) {
                const answerNumber = answerId.answerNumber;
                // delete this answer
                async.series([
                    // first delete all comments with the answer number
                    function (callback2) {
                        const deleteCommentsQuery = "delete from comments where answerNumber = ?";
                        const deleteCommentsQueryOptions = [answerNumber];
                        con.query(deleteCommentsQuery, [deleteCommentsQueryOptions], function (err, result) {
                            try {
                                if (result) {
                                    callback2(null, "Successfully deleted comments!");
                                } else {
                                    callback2(null, 'Error');
                                }
                            } catch (err) {
                                callback2(null, 'Serious error!');
                            }
                        });
                    },
                    // now delete the answer
                    function (callback2) {
                        const deleteAnswerQuery = "delete from answers where answerNumber = ?";
                        const deleteAnswerQueryOptions = [answerNumber];
                        con.query(deleteAnswerQuery, [deleteAnswerQueryOptions], function (err, result) {
                            try {
                                if (result) {
                                    callback2(null, "1");
                                } else {
                                    callback2(null, "0");
                                }
                            } catch (err) {
                                callback2(null, "-1");
                            }
                        });
                    }
                ], function (err, results) {
                    try {
                        if (results) {
                            callback1(null, "All answers deleted");
                        } else {
                            callback1(null, "Some error");
                        }
                    } catch (err) {
                        callback1(null, 'Serious error!');
                    }
                });
            }, function (err) {
                // this is when all of them are executed
                if (err) {
                    callback(null, 'error hai bhai');
                } else {
                    callback(null, 'all answers deleted');
                }
            });
        },
        function (callback) {
            // now delete the question
            con.query(`delete from questions where questionNumber = ${questionNumber}`, function (err, result) {
                console.log(result);
                callback(null, result);
            });
        }
    ], function (err, results) {
        try {
            if (results) {
                res.send("1");
            } else {
                res.send("0");
            }
        } catch (err) {
            res.send("-1");
        }
    });
});



//==================================
//      PUT
//==================================

//--------------
//  QUESTIONS
//--------------

// edit a question 
app.put("/api/questions/:questionNumber", function(req, res) {
    const questionNumber = req.params.questionNumber;
    const questionHeading = req.body.questionHeading;
    const questionSubheading = req.body.questionSubheading;
    const questionContent = req.body.questionContent;

    const sqlQuery = "update questions set questionHeading = ?, questionSubheading = ?, questionContent = ? where questionNumber = ?";
    const sqlOptions = [questionHeading, questionSubheading, questionContent, questionNumber];

    con.query(sqlQuery, sqlOptions, function(err, result) {
        try {
            if(result) {
                res.send("1");
            } else {
                res.send("0");
            }
        } catch (err) {
            res.send("-1");
        }
    });
});

//--------------
//  ANSWERS
//--------------

app.put("/api/answers/:answerNumber", function (req, res) {
    const answerNumber = req.params.answerNumber;
    const answerContent = req.body.answerContent;

    const sqlQuery = "update answers set answerContent = ? where answerNumber = ?";
    const sqlOptions = [answerContent, answerNumber];

    con.query(sqlQuery, sqlOptions, function (err, result) {
        try {
            if (result) {
                res.send("1");
            } else {
                res.send("0");
            }
        } catch (err) {
            res.send("-1");
        }
    });
});

//--------------
//  COMMENTS
//--------------

// update the content of the comment
app.put("/api/comments/:commentNumber", function (req, res) {
    const commentNumber = req.params.commentNumber;
    const commentContent = req.body.commentContent;

    const sqlQuery = "update comments set commentContent = ? where commentNumber = ?";
    const sqlOptions = [commentContent, commentNumber];
    con.query(sqlQuery, sqlOptions, function (err, result) {
        try {
            if (result) {
                res.send("1");
            } else {
                res.send("0");
            }
        } catch (err) {
            res.send("-1");
        }
    });
});

//==================================
//      REQUESTS LISTENING
//==================================

app.listen(3000, function () {
    console.log("Listening on port 3000");
});