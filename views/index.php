<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>MOOCchat</title>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/4.1.1/normalize.min.css" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,700" />
    <link rel="stylesheet" href="./css/moocchat2/main.css" />

    <!-- Piwik code must sit BEFORE require.js loads in main code -->
    <script type="text/javascript">
        var _paq = _paq || [];
        (function() {
            var u="//localhost:8081/piwik/";
            _paq.push(['setTrackerUrl', u+'piwik.php']);
            _paq.push(['setSiteId', 1]);
            var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
            g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
        })();
    </script>
    <noscript><p><img src="//localhost:8081/piwik/piwik.php?idsite=1" style="border:0;" alt="" /></p></noscript>
    <!-- End Piwik Code -->

    <!--[if lte IE9]>
    <script src="./js/rAF.js"></script>
    <![endif]-->
    <script data-main="./js/require.config" src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.2.0/require.min.js"></script>
</head>

<body>
    <div id="header">
        <div id="logo"></div>
        <h1 id="moocchat-name">MOOCchat</h1>
        <div id="course-name"></div>
        <ul id="task-sections"></ul>
    </div>
    <div id="content">
    </div>
</body>

</html>