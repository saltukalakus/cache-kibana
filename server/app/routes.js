module.exports = function(app, passport) {
var User       = require('./models/user');

// normal routes ===============================================================

	// show the home page (will also have our login links)
	app.get('/', function(req, res) {
        if (req.isAuthenticated()) {
            var user = req.user;
            user.hasRole('admin', function (err, isAdmin) {
                if (isAdmin){
                    res.redirect('/kibana');
                } else {
                    res.render('index.html');
                }
            });
        } else {
            res.redirect('/login');
        }
	});

	// LOGOUT ==============================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

	// locally --------------------------------
		// LOGIN ===============================
		// show the login form
		app.get('/login', function(req, res) {
			res.render('login.html', { message: req.flash('loginMessage') });
		});

		// process the login form
		app.post('/login', passport.authenticate('local-login', {
			successRedirect : '/kibana', // redirect to the secure profile section
			failureRedirect : '/login', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

		// SIGNUP =================================
		// show the signup form
		app.get('/signup', function(req, res) {
            if (req.isAuthenticated()) {
                var user = req.user;
                user.hasRole('admin', function (err, isAdmin) {
                    console.log( "Is user admin:", isAdmin );
                    if (isAdmin){
                        res.render('signup.html', { message: req.flash('signupMessage') });
                    } else {
                        res.redirect('/');
                    }
                });
            } else {
                User.count({}, function( err, count){
                    console.log( "Number of users:", count );
                    if (count == 0) {
                        res.render('signup.html', { message: req.flash('signupMessage') });
                    } else {
                        res.redirect('/');
                    }
                })
            }
        });

		// process the signup form
		app.post('/signup', passport.authenticate('local-signup', {
			successRedirect : '/admin', // redirect to the secure admin section
			failureRedirect : '/signup', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

// =============================================================================
// CACHE SERVER CONTROLS PAGE
// Only users with admin or developer privileges can see controls
// =============================================================================
    app.get('/controls', function(req, res) {
        if (req.isAuthenticated()) {
            var user = req.user;
            user.hasRole('operator', function (err, isOperator) {
                console.log( "Is user operator:", isOperator );

                if (isOperator){
                    res.redirect('/');
                } else {
                    res.render('controls.html');
                }
            });
        } else {
            res.redirect('/');
        }
    });

// =============================================================================
// ADMIN CONTROL PAGE
// Only admin privileges can see controls
// =============================================================================
    app.get('/admin', function(req, res) {
        if (req.isAuthenticated()) {
            var user = req.user;
            user.hasRole('admin', function (err, isAdmin) {
                if (isAdmin){
                    //TODO: Temporary hack until we get roles from mongodb.
                    var static_roles = [ {'_id': '5448c2de9090d1b11ab3f19d', 'name': 'developer' },
                                     {'_id': '5448c2de9090d1b11ab3f19c', 'name': 'admin' },
                                     {'_id': '5448c2de9090d1b11ab3f19e', 'name': 'operator' }];
                     User.find({},function(err, users){
                        res.render('admin.html',{
                            app_users : users,
                            roles : static_roles
                        });
                    });
                } else {
                    res.redirect('/');
                }
            });
        } else {
            res.redirect('/');
        }
    });

    // =============================================================================
    // DELETE USER LINK
    // Only admin privileges can delete
    // =============================================================================
    app.get('/delete/user/:user_id', function(req, res) {
        if (req.isAuthenticated()) {
            var user_id = req.params.user_id;
            var user = req.user;
            user.hasRole('admin', function (err, isAdmin) {
                User.findOne({ '_id' : user_id },function(err, user_in_db){
                    console.log(user_in_db);
                    User.remove({'_id' : user_id}, function(error, result){
                        if (error){
                            console.log(error);
                        }
                        console.log(result);
                    } );
                    res.redirect('/admin');
                });
            });
        }
    });
};