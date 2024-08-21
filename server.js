var express = require("express");
var mysql2 = require("mysql2");
var fileuploader = require("express-fileupload");
var nodemailer = require('nodemailer');
var cloudinary=require('cloudinary').v2;

let app = express();

app.listen(1001, function () {
    console.log("Server Started :-)");
});

app.use(express.static("public"));
app.use(express.urlencoded(true));
app.use(fileuploader());

// let config = {
//     host: "127.0.0.1",
//     user: "root",
//     password: "Akhil@123",
//     database: "project"
// };
// let config = {
//     host: "b6onewhd3zmmpscgdlkg-mysql.services.clever-cloud.com",
//     user: "u05mic2nfin4xqr7",
//     password: "Jsbdb0ADkL0Q6lHrrpNN",
//     database: "b6onewhd3zmmpscgdlkg",
//     dateStrings:true,
//     keepAliveInitialDelay : 10000,
//     enableKeepAlive : true,
// };
cloudinary.config({ 
    cloud_name: 'drkcuob6w', 
    api_key: '116692684632995', 
    api_secret: 'hbVnW-7XX_F7JGNJqswfv1JRHZE' // Click 'View API Keys' above to copy your API secret
});

let config= "mysql://avnadmin:AVNS_znqbs173aIMnlxa4ROd@mysql-c487de8-guptakhil05-b2c6.i.aivencloud.com:23180/defaultdb";

var mysql = mysql2.createConnection(config);
mysql.connect(function (err) {
    if (err == null)
        console.log("Connected To Database Successfully");
    else
        console.log(err.message + "  ########");
});

app.get("/", function (req, resp) {
    let path = __dirname + "/public/index.html";
    resp.sendFile(path);
});

app.get("/curd-signup", function (req, resp) {
    console.log(req.query);

    mysql.query("insert into users (email, pwd, utype, status) values(?,?,?,?)",
        [req.query.txtEmail, req.query.txtpwd, req.query.type, 1], function (err) {
            if (err == null)
                resp.send("Account Created");
            else
                resp.send(err.message);
        });
});

app.get("/curd-login", function (req, resp) {
    let email = req.query.txtEmailL;
    let pwd = req.query.txtpwdL;
    mysql.query("SELECT * FROM users WHERE email = ? AND pwd = ?", [email, pwd], function (err, result) {
        if (err != null) {
            resp.send(err.message);
            return;
        }
        if (result.length == 0) {
            resp.send("Invalid ID or Password");
            return;
        }
        if (result[0].status == 1) {
            resp.send(result[0].utype);
            return;
        } else {
            resp.send("You Have Been Blocked");
            return;
        }
    });
});

// Forgot Password
app.get("/curd-forgot-password", function (req, resp) {
    let email = req.query.email;

    mysql.query("SELECT pwd FROM users WHERE email = ?", [email], function (err, result) {
        if (err != null) {
            resp.send(err.message);
            return;
        }
        if (result.length == 0) {
            resp.send("Email not found");
            return;
        }

        let password = result[0].pwd;

        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            service: 'gmail',
            auth: {
                user: 'guptakhil05@gmail.com',
                pass: 'zcsf qsxv frfo agzd'
            }
        });

        let mailOptions = {
            from: 'guptakhil05@gmail.com',
            to: email,
            subject: 'Your Password',
            text: `Your password is ${password}`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                resp.send("Failed to send email");
            } else {
                console.log('Email sent: ' + info.response);
                resp.send("Password has been sent to your email");
            }
        });
    });
});

// influencer-dashboard
app.get("/infl-profile", function (req, resp) {
    let path = __dirname + "/public/infl-profile.html";
    resp.sendFile(path);
})
app.post("/infl-prof-save", async function (req, resp) {
    let fileName;
    try {
        if (req.files != null) {
            fileName = req.files.ppic.name;
            let path = __dirname + "/public/uploads/" + fileName;
            await req.files.ppic.mv(path);

            const result = await cloudinary.uploader.upload(path);
            fileName = result.url;
        } else {
            fileName = "nopic.jpg";
        }

        let fieldString = Array.isArray(req.body.iField) ? req.body.iField.toString() : req.body.iField;

        mysql.query("insert into iprofile values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                req.body.iEmail, req.body.iName, req.body.iGender, req.body.iDob,
                req.body.iContact, req.body.iAddress, req.body.iState, req.body.iCity,
                fieldString, req.body.iInsta, req.body.iFacebook, req.body.iYoutube,
                req.body.iBio, fileName
            ],
            function (err) {
                if (err == null)
                    resp.send("Your Profile has been saved successfully");
                else
                    resp.send(err.message);
            });
    } catch (err) {
        console.error("Error during file upload or database operation:", err);
        resp.status(500).send("An error occurred while saving the profile.");
    }
});


app.post("/infl-prof-update", function (req, resp) {
    let fileName;
    if (req.files != null) {
        fileName = req.files.ppic.name;
        let path = __dirname + "/public/uploads/" + fileName;
        req.files.ppic.mv(path);
    } else {
        fileName = req.body.hdn;
    }

    let fieldString = Array.isArray(req.body.iField) ? req.body.iField.toString() : req.body.iField;

    mysql.query("UPDATE iprofile SET iname=?, gender=?, dob=?, contact=?, address=?, state=?, city=?, field=?, insta=?, fb=?, youtube=?, bio=?, picpath=? WHERE emailid=?",
        [
            req.body.iName, req.body.iGender, req.body.iDob, req.body.iContact,
            req.body.iAddress, req.body.iState, req.body.iCity, fieldString,
            req.body.iInsta, req.body.iFacebook, req.body.iYoutube,
            req.body.iBio, fileName, req.body.iEmail
        ],
        function (err, result) {
            if (err == null) {
                if (result.affectedRows >= 1) {
                    resp.send("Record Updated Successfully");
                } else {
                    resp.send("Invalid");
                }
            } else {
                resp.send(err.message);
            }
        });
});

app.get("/find-iprof-details", function (req, resp) {
    let email = req.query.iEmail;

    mysql.query("SELECT * FROM iprofile WHERE emailid = ?", [email], function (err, resultJsonAry) {
        if (err != null) {
            resp.send(err.message);
            return;
        }
        console.log(resultJsonAry);
        resp.send(resultJsonAry); // sending array of JSON objects
    });
});
app.get("/curd-postEvent", function (req, resp) {
    console.log(req.query);

    mysql.query("insert into events values(null,?,?,?,?,?,?)",
        [req.query.ibEmail, req.query.ibTitle, req.query.ibDate, req.query.ibTime, req.query.ibCity,
        req.query.ibVenue], function (err) {
            if (err == null)
                resp.send("Event Posted");
            else
                resp.send(err.message);
        });
});
//change pwd in settings.
app.post("/settings", function (req, resp) {
    let email = req.body.isEmail;
    let oldPwd = req.body.isOpwd;
    let newPwd = req.body.isNpwd;
    let confirmPwd = req.body.isCpwd;

    if (newPwd !== confirmPwd) {
        resp.send("Passwords don't match");
        return;
    }

    mysql.query("SELECT * FROM users WHERE email = ? AND pwd = ?", [email, oldPwd], function (err, result) {
        if (err != null) {
            resp.send(err.message);
            return;
        }
        if (result.length == 0) {
            resp.send("Invalid current password");
            return;
        }

        mysql.query("UPDATE users SET pwd = ? WHERE email = ?", [newPwd, email], function (err) {
            if (err == null) {
                resp.send("Password Changed");
            } else {
                resp.send(err.message);
            }
        });
    });
});
app.get("/infl-EventsM",function(req,resp){
    let path = __dirname + "/public/infl-eventsManager.html";
    resp.sendFile(path);
})
app.get("/All-EventsM",function(req,resp){
    console.log(req.query.email);
    mysql.query("Select * from events where doe>=current_date() && emailid=?",[req.query.email.trim()],function(err,result){
        
        if(err!=null){
            resp.send(err.message);
        }
        console.log(result);
        resp.send(result);
        
        
    })
})
app.delete('/Del-EventsM', function (req, resp) {
    const rid = req.query.rid;

    mysql.query("DELETE FROM events WHERE rid = ?", [rid], function (err, result) {
        if (err) {
            resp.status(500).send(err.message);
            return;
        }
        resp.status(200).send("Event deleted successfully");
    });
});

// collaborator-dashboard
app.get("/client-profile", function (req, resp) {
    let path = __dirname + "/public/client-profile.html";
    resp.sendFile(path);
})
app.post("/client-prof-save", async function (req, resp) {
    let fileName;
    try{
    if (req.files != null) {
        fileName = req.files.ppic.name;
        let path = __dirname + "/public/uploads/" + fileName;
        await req.files.ppic.mv(path);

            const result = await cloudinary.uploader.upload(path);
            fileName = result.url;
    } else {
        fileName = "nopic.jpg";
    }
    
    mysql.query("insert into cprofile values(?,?,?,?,?,?,?,?,?,?,?,?)",
        [
            req.body.cEmail, req.body.cName, req.body.cGender, req.body.cDob,
            req.body.cContact, req.body.cAddress, req.body.cState, req.body.cCity,
            req.body.cOrg, req.body.cInsta, req.body.cBio, fileName
        ],
        function (err) {
            if (err == null)
                resp.send("Your profile has been saved Successfully");
            else
                resp.send(err.message);
        });
    } catch (err) {
        console.error("Error during file upload or database operation:", err);
        resp.status(500).send("An error occurred while saving the profile.");
    }
});

app.post("/client-prof-update", function (req, resp) {
    let fileName;
    if (req.files != null) {
        fileName = req.files.ppic.name;
        let path = __dirname + "/public/uploads/" + fileName;
        req.files.ppic.mv(path);
    } else {
        fileName = req.body.hdn;
    }

    mysql.query("UPDATE cprofile SET cname=?, gender=?, dob=?, contact=?, address=?, state=?, city=?, org=?, insta=?, bio=?, picpath=? WHERE emailid=?",
        [
            req.body.cName, req.body.cGender, req.body.cDob, req.body.cContact,
            req.body.cAddress, req.body.cState, req.body.cCity, req.body.cOrg,
            req.body.cInsta,req.body.cBio, fileName, req.body.cEmail
        ],
        function (err, result) {
            if (err == null) {
                if (result.affectedRows >= 1) {
                    resp.send("Record Updated Successfully");
                } else {
                    resp.send("Invalid");
                }
            } else {
                resp.send(err.message);
            }
        });
});

app.get("/find-cprof-details", function (req, resp) {
    let email = req.query.cEmail;

    mysql.query("SELECT * FROM cprofile WHERE emailid = ?", [email], function (err, resultJsonAry) {
        if (err != null) {
            resp.send(err.message);
            return;
        }
        console.log(resultJsonAry);
        resp.send(resultJsonAry); // sending array of JSON objects
    });
});
app.get("/inflC-finder",function(req,resp){
    let path = __dirname + "/public/infl-finder.html";
    resp.sendFile(path);
})
app.get("/send-email", function (req, resp) {
    let email = req.query.email;

    mysql.query("SELECT pwd FROM users WHERE email = ?", [email], function (err, result) {
        if (err != null) {
            resp.send(err.message);
            return;
        }
        if (result.length == 0) {
            resp.send("Email not found");
            return;
        }

        let password = result[0].pwd;

        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            service: 'gmail',
            auth: {
                user: 'guptakhil05@gmail.com',
                pass: 'zcsf qsxv frfo agzd'
            }
        });

        let mailOptions = {
            from: 'guptakhil05@gmail.com',
            to: email,
            subject: 'You Have a Collaborator',
            text: `We have a great collaboration opportunity available for you from ${email}. Please check your email for details!`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                resp.send("Failed to send email");
            } else {
                console.log('Email sent: ' + info.response);
                resp.send("Email has been sent");
            }
        });
    });
});


//admin-dash
app.get("/admin-dash",function(req,resp){
    let path = __dirname + "/public/admin-dash.html";
    resp.sendFile(path);
})
app.get("/admin-userM", function (req, resp) {
    let path = __dirname + "/public/admin-users.html";
    resp.sendFile(path);
})
app.get("/admin-allInfl", function (req, resp) {
    let path = __dirname + "/public/admin-all-infl.html";
    resp.sendFile(path);
})
app.get("/admin-allClient", function (req, resp) {
    let path = __dirname + "/public/admin-all-client.html";
    resp.sendFile(path);
})

//admin user manager
app.get("/fetch-all", function (req, resp) {
    mysql.query("Select * from users", function (err, result) {
        if (err != null) {
            resp.send(err.message);
            return;
        }
        resp.send(result);
    })
})
app.get("/del-one", function (req, resp) {
    mysql.query("delete from users where email=?", [req.query.email], function (err, result) {
        if (err != null) {
            resp.send(err.message);
            return;
        }
        resp.send(result);
    })
})
app.get("/block-one", function (req, res) {
    mysql.query("UPDATE users SET status=0 WHERE email=?", [req.query.email], function (err, result) {
        if (err != null) {
            res.send(err.message);
            return;
        }
        if (result.affectedRows > 0) {
            res.send("User Blocked");
        } else {
            res.send("User Not Found");
        }
    });
});
app.get("/unblock-one", function (req, res) {
    mysql.query("UPDATE users SET status=1 WHERE email=?", [req.query.email], function (err, result) {
        if (err != null) {
            res.send(err.message);
            return;
        }
        if (result.affectedRows > 0) {
            res.send("User Resumed");
        } else {
            res.send("User Not Found");
        }
    });
});

//admin influencer console
app.get("/fetch-infl", function (req, resp) {
    mysql.query("SELECT * FROM iprofile WHERE emailid IN (SELECT email FROM users WHERE utype='influencer')", function (err, result) {
        if (err != null) {
            resp.send(err.message);
            return;
        }
        resp.send(result);
    });
});
//admin collaborator console
app.get("/fetch-client", function (req, resp) {
    mysql.query("SELECT * FROM cprofile WHERE emailid IN (SELECT email FROM users WHERE utype='collaborator')", function (err, result) {
        if (err != null) {
            resp.send(err.message);
            return;
        }nox 
        resp.send(result);
    });
});

// Route to serve the influencer finder HTML page
app.get("/infl-finder", function (req, resp) {
    let path = __dirname + "/public/infl-finder.html";
    resp.sendFile(path);
});

// Route to find influencers by field
app.get("/find-influ", function (req, resp) {
    mysql.query("SELECT * FROM iprofile WHERE field LIKE ?", ["%" + req.query.field + "%"], function (err, result) {
        if (err != null) {
            resp.send(err.message);
            return;
        }
        resp.send(result);
    });
});
app.get("/do-Find",function(req,resp){
    mysql.query("Select * from iprofile where field like ? && city=?",["%" + req.query.field + "%",req.query.city],function(err,result){
        if (err != null) {
            resp.send(err.message);
            return;
        }
        resp.send(result);
    })
})
app.get("/find-by-name", function (req, resp) {
    mysql.query("SELECT * FROM iprofile WHERE iname LIKE ?", ["%" + req.query.name + "%"], function (err, result) {
        if (err) {
            resp.send(err.message);
            return;
        }
        resp.send(result);
    });
});