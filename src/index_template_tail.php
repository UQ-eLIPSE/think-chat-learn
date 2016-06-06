<div id="footer" class="footer">


</div>





<?php
} else { # If server not currently active, show following page instead
?>


  <!-- START preview-page -->
  <div id="preview-page" class="moocchat-page">
      <div class="container">
          <div class="row">
              <div class="col-md-6 col-md-offset-2">&nbsp;
              </div>
          </div>
          <div class="row">
              <div class="col-md-6 col-md-offset-3 text-center">
                  <label><?=$next_session_text;?></label>
              </div>
          </div>
      </div>
  </div>
  <!-- END preview-page -->

<?php
}
?>
<div id="session_question" class="hidden">
Next session is on Thursday, 06/08/2015 from 20:00 to 22:00.
<!--<?= $question; ?>--></div>




<div id="dialog" style="display:none">
  <div>

  </div>
</div>
</body>
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-65584333-1', 'auto');
  ga('send', 'pageview');
  //ga('set', '&uid', {{'<?php echo $_SERVER["HTTP_X_UQ_USER"]; ?>'}}); // Set the user ID using signed-in user_id.
</script>
    <!-- Core JavaScript -->
  <script src="./js/socket.io-1.4.5.js"></script>
  <script src="./js/jquery-2.2.3.min.js"></script>
  <script src="./js/bootstrap.min.js"></script>
  <script src="./js/jquery.cookie.js"></script>
 <script src="./js/jquery.validate.min.js"></script>
  <!-- MOOCchat Custom JavaScript -->
  <script src="./js/settings.js"></script>
  <script src="./js/moocchat-utilities.js"></script>
  <script src="./js/moocchat.constants.js"></script>
  <script src="./js/moocchat.stages.js"></script>
  <script src="./js/moocchat.js"></script>
  <script src="./js/stateflow.js"></script>
  <script src="./js/moocchat-state-based.js"></script>
</html>
<!-- Modal -->
<div class="modal fade" id="participant_information_sheet_modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
<div class="modal-dialog modal-lg" role="document">
  <div class="modal-content">
    <div class="modal-header">
      <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
      <h4 class="modal-title" id="myModalLabel">Participant Information Sheet</h4>
    </div>
    <div class="modal-body">
            <object type="application/pdf" data="ENGG1200_MOOCchat_Participant_Information_Sheet.pdf" width="100%" height="500">this is not working as expected</object>

    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>

    </div>
  </div>
</div>
</div>
