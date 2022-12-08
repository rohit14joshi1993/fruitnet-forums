// Route handler for forum web app

const { application } = require("express");

module.exports = function (app, forumData) {
  // Handle our routes

  //validator
  const { check, validationResult } = require("express-validator");

  //login redirect
  const redirectLogin = (req, res, next) => {
    //if a session ID hasn't been set (user isn't logged on), user is redirected to the login page
    if (!req.session.userId) {
      res.redirect("./login");
    } else {
      next();
    }
  };

  // Home page
  app.get("/", function (req, res) {
    res.render("index.ejs", forumData);
  });

  // About page
  app.get("/about", function (req, res) {
    res.render("about.ejs", forumData);
  });

  // View Posts page
  app.get("/viewposts", function (req, res) {
    let username = req.params.username;

    // Query to select all posts from the database
    let sqlquery = `select * from viewposts`;

    // Run the query
    db.query(sqlquery, [username], (err, result) => {
      if (err) {
        res.redirect("./");
      }

      // Pass results to the EJS page and view it
      let data = Object.assign({}, forumData, { posts: result });
      console.log(data);
      res.render("viewposts.ejs", data);
    });
  });

  // List Users page
  app.get("/users", function (req, res) {
    // Query to select all users
    let sqlquery = `SELECT * FROM viewusers`;

    // Run the query
    db.query(sqlquery, (err, result) => {
      if (err) {
        res.redirect("./");
      }

      // Pass results to the EJS page and view it
      let data = Object.assign({}, forumData, { users: result });
      console.log(data);
      res.render("users.ejs", data);
    });
  });

  // List Topics page
  app.get("/topics", function (req, res) {
    // Query to select all topics
    let sqlquery = `SELECT   topic_id, topic_title, topic_description
                        FROM     topics
                        ORDER BY topic_title`;

    // Run the query
    db.query(sqlquery, (err, result) => {
      if (err) {
        res.redirect("./");
      }

      // Pass results to the EJS page and view it
      let data = Object.assign({}, forumData, { topics: result });
      console.log(data);
      res.render("topics.ejs", data);
    });
  });

  // Add a New Post page
  app.get("/addpost", function (req, res) {
    // Set the initial values for the form
    let initialvalues = { username: "", topic: "", title: "", content: "" };

    // Pass the data to the EJS page and view it
    return renderAddNewPost(res, initialvalues, "");
  });

  // Helper function to
  function renderAddNewPost(res, initialvalues, errormessage) {
    let data = Object.assign({}, forumData, initialvalues, {
      errormessage: errormessage,
    });
    console.log(data);
    res.render("addpost.ejs", data);
    return;
  }

  // Add a New Post page form handler
  app.post("/postadded", function (req, res) {
    let user_id = -1;
    let topic_id = -1;

    // Get the user id from the user name
    let sqlquery = `SELECT * viewusers username = ?`;
    db.query(sqlquery, [req.body.username], (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      if (result.length == 0) {
        return renderAddNewPost(res, req.body, "Can't find that user");
      }
      user_id = result[0].user_id;
      console.log("user is " + user_id);

      // Get the topic id from the topic title
      sqlquery = `SELECT * FROM topics WHERE topic_title = ?`;
      db.query(sqlquery, [req.body.topic], (err, result) => {
        if (err) {
          return console.error(err.message);
        }
        if (result.length == 0) {
          return renderAddNewPost(res, req.body, "Can't find that topic");
        }
        topic_id = result[0].topic_id;
        console.log("topic is " + topic_id);

        // Check the user is a member of the topic
        sqlquery = `SELECT COUNT(*) as countmembership FROM membership WHERE user_id=? AND topic_id=?;`;
        db.query(sqlquery, [user_id, topic_id], (err, result) => {
          if (err) {
            return console.error(err.message);
          }
          if (result[0].countmembership == 0) {
            return renderAddNewPost(
              res,
              req.body,
              "User is not a member of that topic"
            );
          }

          // Everything is in order so insert the post
          // sqlquery = `INSERT INTO posts (post_date, post_title, post_content, user_id, topic_id)
          //                       VALUES (now(), ?, ?, ?, ?)`;

          sqlquery = `CALL sp_addPost(?, ?, ?, ?)`;

          // let newrecord = [req.body.title, req.body.content, user_id, topic_id];

          let newrecord = [
            req.body.title,
            req.body.content,
            req.body.topic,
            req.body.username,
          ];

          // let newrecord = [
          //   req.body.title,
          //   req.body.content,
          //   req.body.topic,
          //   req.body.username,
          // ];
          console.log(newrecord);
          db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
              return console.error(err.message);
            } else res.send("You post has been added to forum");
          });
        });
      });
    });
  });

  // Search for Posts page
  app.get("/search", function (req, res) {
    res.render("search.ejs", forumData);
  });

  // Search for Posts form handler
  app.get("/search-result", function (req, res) {
    //searching in the database
    let term = "%" + req.query.keyword + "%";

    let sqlquery = `SELECT * FROM searchposts WHERE  post_title LIKE ? OR post_content LIKE ? ORDER BY post_date desc`;

    // mysql query
    db.query(sqlquery, [term, term], (err, result) => {
      if (err) {
        res.redirect("./");
      }
      // Pass results to the EJS page and view it
      let data = Object.assign({}, forumData, { posts: result });
      console.log(data);
      res.render("search-result.ejs", data);
    });
  });

  /*-----------------------------------Extensions----------------------------------------------

Basic Tasks :
                - User Page [o]
                - Topic Page [o]
                - Post for User Page [o]

Additional  Basic Tasks for brushing the skills:
                - Styling [o]
                - Post Page for Topic Page [o]
                - Delete Post [x]
                - Post Page [x]
---------------------------------------------------
---------------------------------------------------

Advance Tasks:
                - Use Views [x]
                - Use Stored Procedures [x]
                - Login sessions [x]

Additional  Advance Tasks for brushing the skills:
                - Reply to Post [x]
--------------------------------------------------
--------------------------------------------------

Additional Tasks for brushing the skills:
                - Styling [o]
                - Delete Post [x]
                - Post Page [x]
                - Post Page for Topic Page [o]
                - Reply to Post [x]

---------------------------------------------------------------------------------------------*/

  // List Users-profile page
  app.get("/user-profile/:name", function (req, res) {
    //
    let term = req.params.name;
    console.log(term);
    // Query to select user from all users
    let sqlquery1 = `SELECT *
                                    FROM viewusers
                                    WHERE username=?`;

    // Query to select to select from topics from views
    let sqlquery2 = `SELECT DISTINCT topic_id, topic_title, topic_description 
    FROM catalog
    WHERE user_id = ? `;

    // Run the query
    db.query(sqlquery1, [term], (err, result) => {
      if (err) {
        res.redirect("./");
      }
      console.log("-----------------------------------------");
      console.log("result: ", result);
      //   console.log("result[0].username", result[0].username);
      // console.log("result[0].user_id", result[0].user_id);
      console.log("-----------------------------------------");

      // Pass results to the EJS page and view it
      // Run the query
      let term1 = result[0].user_id;
      console.log("term 1: ", term1);

      db.query(sqlquery2, [term1], (err, result1) => {
        if (err) {
          res.redirect("./");
        }

        console.log("-----------------------------------------");
        // console.log("result1: ", result1);
        //   console.log("result[0].username", result[0].username);
        console.log("-----------------------------------------");

        // Pass results to the EJS page and view it
        let data = Object.assign(
          {},
          forumData,
          { user: result[0] },
          { topics: result1 }
        );
        console.log("final data: ", data);
        res.render("user-profile.ejs", data);
      });
    });
  });

  // View Posts userpage page by Rohit Joshi
  app.get("/viewposts/:username", function (req, res) {
    let username = req.params.username;

    // Query to select all posts from the database
    let sqlquery = `SELECT  * FROM catalog	
    WHERE username = ?	
    ORDER BY post_date DESC`;

    console.log("username: ", username);
    // Run the query
    db.query(sqlquery, [username], (err, result) => {
      if (err) {
        res.redirect("./");
      }

      console.log("viewpost: ", result);
      // Pass results to the EJS page and view it
      let data = Object.assign({}, forumData, { posts: result });
      console.log(data);
      res.render("user-viewposts.ejs", data);
    });
  });

  // List Topics page
  app.get("/topics/:name", function (req, res) {
    let topic = req.params.name;
    console.log(topic);
    // Query to select all topics
    let sqlquery = `SELECT   DISTINCT t.topic_id, t.topic_title, t.topic_description
    FROM topics t
    WHERE t.topic_title = ?
    ORDER BY t.topic_title DESC`;

    // Run the query
    db.query(sqlquery, [topic], (err, result) => {
      if (err) {
        res.redirect("./");
      }
      console.log(result);

      let sqlquery2 = `SELECT * from onetopicposts
      WHERE topic_id = ?
      ORDER BY post_date DESC;
      `;
      let t_id = result[0].topic_id;
      console.log("t_id", t_id);

      db.query(sqlquery2, [t_id], (err, result1) => {
        if (err) {
          res.redirect("./");
        }
        console.log("users: ", result1);

        // Pass results to the EJS page and view it
        let data = Object.assign(
          {},
          forumData,
          { topics: result },
          { users: result1 }
        );
        console.log(data);
        res.render("topic-page.ejs", data);
      }); // end of db sqlquery 2
    }); // end of db sqlquery
  });

  // post-profile page
  app.get("/post-profile/:name", function (req, res) {
    //
    let term = req.params.name;
    console.log(term);
    // Query to select user from all users
    let sqlquery1 = `SELECT *
                                  FROM viewusers
                                  WHERE username=?`;

    // Query to select to select from topics from views
    let sqlquery2 = `SELECT DISTINCT topic_id, topic_title, topic_description 
  FROM catalog
  WHERE user_id = ? `;

    // Run the query
    db.query(sqlquery1, [term], (err, result) => {
      if (err) {
        res.redirect("./");
      }
      console.log("-----------------------------------------");
      console.log("result: ", result);
      //   console.log("result[0].username", result[0].username);
      // console.log("result[0].user_id", result[0].user_id);
      console.log("-----------------------------------------");

      // Pass results to the EJS page and view it
      // Run the query
      let term1 = result[0].user_id;
      console.log("term 1: ", term1);

      db.query(sqlquery2, [term1], (err, result1) => {
        if (err) {
          res.redirect("./");
        }

        console.log("-----------------------------------------");
        // console.log("result1: ", result1);
        //   console.log("result[0].username", result[0].username);
        console.log("-----------------------------------------");

        // Pass results to the EJS page and view it
        let data = Object.assign(
          {},
          forumData,
          { user: result[0] },
          { topics: result1 }
        );
        console.log("final data: ", data);
        res.render("user-profile.ejs", data);
      });
    });
  });

  app.get("/login", (req, res) => {
    res.render("login.ejs", forumData);
  });

  app.get("/register", (req, res) => {
    res.render("register.ejs", forumData);
  });
  /*
  // TODO from mongodb to mysql

  //executed when the register form is submitted
  //checks that the email is valid, username is not empty, and password is of length 8 minimum
  app.post(
    "/registered",
    [
      check("email").isEmail(),
      check("username").not().isEmpty(),
      check("password").isLength({ min: 8 }),
    ],
    function (req, res) {
      //if the validation has errors, the user is directed back to the register page
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.redirect("./register");
      } else {
        //connecting to database

        //TODO REFACTOR to MySQL
        // var MongoClient = require("mongodb").MongoClient;
        // var url = "mongodb://localhost";

        let  sqlquery1 = 

        //sanitizing password and username
        const plainPassword = req.sanitize(req.body.password);
        const sanitizedUsername = req.sanitize(req.body.username);

        //hashing password
        const bcrypt = require("bcrypt"); //inclusion of bycrypt module
        const saltRounds = 10;
        bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
          MongoClient.connect(url, function (err, client) {
            if (err) throw err;
            var db = client.db("calorieBuddy");
            //saving data to collection users
            db.collection("users").insertOne({
              //key: value
              username: sanitizedUsername,
              password: hashedPassword,
              firstname: req.body.firstname,
              lastname: req.body.lastname,
              email: req.body.email,
            });
            client.close();
          });
          //sending confirmation message by rendering empty ejs template with array of strings
          var message = [
            "Success!",
            "You are now registered.",
            "Your user name is: " + sanitizedUsername,
            "Your hashed password is: " + hashedPassword,
          ];
          res.render("confirmation.ejs", { messages: message });
        });
      }
    }
  );

  // TODO from mongodb to mysql
  //exectuted when the login form has been submitted
  app.post("/loggedin", function (req, res) {
    //connecting to database

    //TODO REFACTOR to MySQL
    var MongoClient = require("mongodb").MongoClient;
    var url = "mongodb://localhost";

    const bcrypt = require("bcrypt"); //inclusion of bycrpt module

    MongoClient.connect(url, function (err, client) {
      if (err) throw err;
      var db = client.db("calorieBuddy");
      const plainPassword = req.body.password;
      //searchind database for username
      db.collection("users")
        .find({ username: req.body.username })
        .toArray((findErr, results) => {
          if (findErr) throw findErr;
          else {
            //checking that username has been found, if not sending an error message
            if (results.length == 0) {
              //message sent by rendering empty ejs template with array of strings
              var message = [
                "Failure",
                "Login unseccessful.",
                "Username incorrect, please try again.",
              ];
              res.render("confirmation.ejs", { messages: message });
            } else {
              //comparing entered password to hashed password in database
              var hashedPassword = results[0].password;
              bcrypt.compare(
                plainPassword,
                hashedPassword,
                function (err, result) {
                  if (err) throw err;
                  else {
                    //checking is passwords don't match, if so sending an error message
                    if (result == false) {
                      var message = [
                        "Failure",
                        "Login unseccessful.",
                        "Password incorrect, please try again.",
                      ];
                      res.render("confirmation.ejs", { messages: message });
                    } else {
                      //saving user session since login was successful
                      req.session.userId = req.body.username;
                      //sending a confirmation by rendering empty ejs template with array of strings
                      var message = ["Success!", "You are now logged in."];
                      res.render("confirmation.ejs", { messages: message });
                    }
                  }
                }
              );
            }
          }
          client.close();
        });
    });
  });

  // TODO from mongodb to mysql
  //executed once 'logout' button on navigation bar is pressed
  app.get("/logout", redirectLogin, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.redirect("./");
      }
      //sending a confirmation message by rendering empty ejs template with array of strings
      var message = [
        "Bye-bye",
        "You have been logged out.",
        "We hope to see you back soon!",
      ];
      res.render("confirmation.ejs", { messages: message });
    });
  });

  //delete confirmation page
  app.get("/delete-confirmation", function (req, res) {
    // TODO from mongodb to mysql
    res.render("delete-confirmation.html");
  });
  */
};
