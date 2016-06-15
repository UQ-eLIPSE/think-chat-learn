<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- From http://stackoverflow.com/questions/1341089/using-meta-tags-to-turn-off-caching-in-all-browsers -->
    <meta http-equiv="cache-control" content="max-age=0" />
    <meta http-equiv="cache-control" content="no-cache" />
    <meta http-equiv="expires" content="0" />
    <meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />
    <meta http-equiv="pragma" content="no-cache" />

    <title>MOOCchat - Backup clients</title>

    <!-- Bootstrap Core CSS -->
    <link href="css/bootstrap-simplex.css" rel="stylesheet" />
    <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">

    <!-- MOOCchat Custom CSS -->
    <link href="css/moocchat.css" rel="stylesheet" />
    <!--[if lt IE 9]>
    <script src="./js/html5shiv.min.js"></script>
    <script src="./js/respond.min.js"></script>
    <![endif]-->


    <style>
        #body-container {
            max-width: 900px;
            margin: 0 auto;
        }
        
        #header {
            position: relative;
            padding: 15px;
            margin-bottom: 0;
        }
    </style>
</head>

<body>
    <div id="body-container">
        <div id="header">
            <h1>ENGG1200 - MoocChat <i class="fa fa-users"></i></h1>
            <img src="img/uq-logo.png" width="150" style="position: absolute; right: 15px; top: 36px;">
        </div>

        <div>
            <div id="login" class="row moocchat-page">
                <div class="col-md-12">
                    <h2>Login to join backup client queue</h2>
                    <form>
                        <label for="username">Username</label> <input id="username" class="form-control" /><br>
                        <input type="submit" value="Login" class="btn btn-info" />
                    </form>
                </div>
            </div>

            <div id="question-response" class="row moocchat-page">
                <div class="col-md-12">
                    <h2>Please answer the question below before joining the queue</h2>
                    <p id="question-reading"></p>
                    <p id="question-statement"></p>
                    <form>
                        <label for="answers">Select an answer:</label>
                        <ul id="answers"></ul>
                        <label for="justification">Enter justification:</label>
                        <textarea id="justification" class="form-control"></textarea>
                        <br>
                        <input type="submit" value="Submit response and join queue" class="btn btn-info" />
                    </form>
                </div>
            </div>

            <div id="management" class="row moocchat-page">
                <div class="col-md-4">
                    <h3>Backup client queue</h3>
                    <ul id="backup-client-queue">
                        <li>Tutor1</li>
                        <li>Tutor2 <input type="button" value="Logout" class="btn btn-danger btn-xs" /></li>
                        <li>Tutor3</li>
                    </ul>
                </div>
                <div class="col-md-8">
                    <h3>Status</h3>
                    <p>There are currently <span id="number-of-clients-in-pool">5</span> student(s) waiting in the formation
                        pool.
                    </p>

                    <h3>Question information</h3>
                    <p id="question-reading"></p>
                    <p id="question-statement"></p>
                    <ul id="answers"></ul>
                    <p>Your selected answer: ...</p>
                </div>
            </div>

            <div id="chat" class="row moocchat-page">
                <div class="col-md-2">
                    <input type="button" value="Request End Chat" class="btn btn-danger btn-s" />
                </div>
                <div class="col-md-10">
                    <div id="chat-box"></div>
                    <form>
                        <input type="text"></input><button>Send</button>
                    </form>
                </div>
            </div>



        </div>

        <!-- Core JavaScript -->
        <script src="./js/socket.io-1.4.5.js"></script>
        <script src="./js/jquery-2.2.3.min.js"></script>
        <!-- MOOCchat Custom JavaScript -->
        <script src="./js/settings.js"></script>
        <script src="./js/stateflow.js"></script>
        <script src="./js/moocchat-backup-client-mgmt.js"></script>

</body>

</html>