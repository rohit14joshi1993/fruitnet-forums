// Route handler for forum web app

module.exports = function (app, forumData) {
  // Handle our routes

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
    let sqlquery = `SELECT DISTINCT p.post_id,p.user_id, p.topic_id, t.topic_title, t.topic_description, p.post_date, p.post_title, p.post_content,u.username
                  FROM posts as p
                  INNER JOIN membership as m on m.user_id = p.user_id
                  INNER JOIN topics as t on p.topic_id = t.topic_id 
                  INNER JOIN users as u on u.user_id = p.user_id
                  ORDER BY p.post_date DESC`;

    // let sqlquery2 = `SELECT DISTINCT post_id, user_id, topic_id, topic_title, topic_description, post_date, post_title, post_content,username
    //               FROM catalog
    //               ORDER BY p.post_date DESC`;



    // let sqlquery = `call get_posts_by_username(${username}, "desc");
    //                           `;

    // Run the query
    db.query(sqlquery,[username], (err, result) => {
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
    let sqlquery = `SELECT   user_id, username, firstname, surname, country
                        FROM     users 
                        ORDER BY username;`;

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
  app.post("/postadded", function(req, res) {
    let user_id = -1;
    let topic_id = -1;

    // Get the user id from the user name
    let sqlquery = `SELECT * FROM users WHERE username = ?`;
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
          sqlquery = `INSERT INTO posts (post_date, post_title, post_content, user_id, topic_id)
                                VALUES (now(), ?, ?, ?, ?)`;
          let newrecord = [req.body.title, req.body.content, user_id, topic_id];
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

    let sqlquery = `SELECT *
                        FROM   posts p
                        JOIN topics t
                        ON p.topic_id = t.topic_id
                        WHERE  post_title LIKE ? OR post_content LIKE ?
                        ORDER BY post_date desc
                        `;

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
    let sqlquery1 = `SELECT u.user_id, u.username, u.firstname, u.surname, u.country
                                    FROM users u
                                    WHERE u.username=?`;

    // Query to select to select from topics from views
    // let sqlquery2 = `SELECT DISTINCT t.topic_title, t.topic_description FROM users u
    //                                 INNER JOIN membership m on m.user_id = u.user_id
    //                                 INNER JOIN topics t on t.topic_id = m.topic_id
    //                                 WHERE u.username = ?
    //                                 ORDER BY t.topic_title`;
    
    let sqlquery2  = `SELECT DISTINCT topic_id, topic_title, topic_description 
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
      console.log("term 1: ",term1);

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
    let sqlquery = `SELECT DISTINCT p.post_id,p.user_id, p.topic_id, t.topic_title, t.topic_description, p.post_date, p.post_title, p.post_content,u.username
                  FROM posts AS p
                  INNER JOIN  membership   AS m  ON    m.user_id = p.user_id
                  INNER JOIN  topics             AS t    ON    p.topic_id = t.topic_id 
                  INNER JOIN  users              AS u    ON   u.user_id = p.user_id
                  WHERE u.username = ?
                  ORDER BY p.post_date DESC`;

    // let sqlquery2 = `SELECT DISTINCT post_id, user_id, topic_id, topic_title, topic_description, post_date, post_title, post_content,username
    //               FROM catalog
    //               ORDER BY p.post_date DESC`;



    // let sqlquery = `call get_posts_by_username(${username}, "desc");
    //                           `;

    console.log("username: ", username);
    // Run the query
    db.query(sqlquery,[username], (err, result) => {
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
        ORDER BY topic_title DESC;`;
    
    // Run the query
    db.query(sqlquery, [topic],(err, result) => {
      if (err) {
        res.redirect("./");
      }
      console.log(result);

      let sqlquery2 = `SELECT p.post_id, u.user_id, u.username, p.post_content, p.post_title
      FROM posts p
      INNER JOIN topics AS t ON p.topic_id = t.topic_id
      INNER JOIN users AS u ON u.user_id = p.user_id
      WHERE t.topic_id = ?
      ORDER BY p.post_date DESC;
      `;
      let t_id = result[0].topic_id;
      console.log("t_id", t_id);

      db.query(sqlquery2,[t_id],(err,result1)=>{
        if (err) {
          res.redirect("./");
        }
        console.log("users: ", result1);

      // Pass results to the EJS page and view it
      let data = Object.assign(
          {}, 
          forumData,
         { topics: result },
         {users: result1}
         );
      console.log(data);
      res.render("topic-page.ejs", data);
      
      
      });// end of db sqlquery 2
    });// end of db sqlquery
  });

};
