<?php
/**
 * COPS (Calibre OPDS PHP Server) HTML main script
 *
 * @license    GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @author     Sébastien Lucas <sebastien@slucas.fr>
 *
 */
 
    require_once ("config.php");
    require_once ("base.php");
    require_once ("author.php");
    require_once ("serie.php");
    require_once ("tag.php");
    require_once ("language.php");
    require_once ("customcolumn.php");
    require_once ("book.php");
    
    // If we detect that an OPDS reader try to connect try to redirect to feed.php
    if (preg_match("/(MantanoReader|FBReader|Stanza|Aldiko|Moon+ Reader)/", $_SERVER['HTTP_USER_AGENT'])) {
        header("location: feed.php");
        exit ();
    }
    
    header ("Content-Type:text/html;charset=utf-8");
    $page = getURLParam ("page", Base::PAGE_INDEX);
    $query = getURLParam ("query");
    $qid = getURLParam ("id");
    $n = getURLParam ("n", "1");
    $database = GetUrlParam (DB);
?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>COPS</title>
    <script type="text/javascript" src="<?php echo getUrlWithVersion("resources/jQuery/jquery-1.10.1.min.js") ?>"></script>
    <script type="text/javascript" src="<?php echo getUrlWithVersion("resources/jquery-cookie/jquery.cookies.js") ?>"></script>
    <script type="text/javascript" src="<?php echo getUrlWithVersion("resources/Magnific-Popup/jquery.magnific-popup.min.js") ?>"></script>
    <link rel="stylesheet" type="text/css" href="<?php echo getUrlWithVersion("resources/Magnific-Popup/magnific-popup.css") ?>" media="screen" />
    <script type="text/javascript" src="<?php echo getUrlWithVersion("js/jquery.sortElements.js") ?>"></script>
    <script type="text/javascript" src="<?php echo getUrlWithVersion("resources/doT/doT.min.js") ?>"></script>
    <script type="text/javascript" src="<?php echo getUrlWithVersion("resources/lru/lru.js") ?>"></script>
    <script type="text/javascript" src="<?php echo getUrlWithVersion("util.js") ?>"></script>
    <link rel="related" href="<?php echo $config['cops_full_url'] ?>feed.php" type="application/atom+xml;profile=opds-catalog" title="<?php echo $config['cops_title_default']; ?>" /> 
    <link rel="icon" type="image/vnd.microsoft.icon" href="favicon.ico" />
    <link rel='stylesheet' type='text/css' href='http://fonts.googleapis.com/css?family=Open+Sans:400,300italic,800,300,400italic,600,600italic,700,700italic,800italic' />
    <link rel="stylesheet" type="text/css" href="<?php echo getUrlWithVersion(getCurrentCss ()) ?>" media="screen" />
    <link rel="stylesheet" type="text/css" href="<?php echo getUrlWithVersion("resources/normalize/normalize.css") ?>" />
    <script type="text/javascript">
    
        $(document).ready(function() {
            // Handler for .ready() called.
            
            var url = "<?php echo "getJSON.php?" . addURLParameter ($_SERVER["QUERY_STRING"], "complete", 1); ?>";
            
            $.when($.get('templates/default/header.html'),
                   $.get('templates/default/footer.html'),
                   $.get('templates/default/bookdetail.html'),
                   $.get('templates/default/main.html'),
                   $.get('templates/default/page.html'),
                   $.getJSON(url)).done(function(header, footer, bookdetail, main, page, data){
                templateBookDetail = doT.template (bookdetail [0]);
                
                var defMain = {
                    bookdetail: bookdetail [0]
                };
                
                templateMain = doT.template (main [0], undefined, defMain);
                
                var defPage = {
                    header: header [0],
                    footer: footer [0],
                    main  : main [0],
                    bookdetail: bookdetail [0]
                };
                
                templatePage = doT.template (page [0], undefined, defPage);
                currentData = data [0];
                
                updatePage (data [0]);
                cache.put (url, data [0]);
                history.replaceState(url, "", window.location);
            });
            
        });
        
        

    </script>
</head>
<body>
</body>
</html>
