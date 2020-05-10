async function getCookies(url){
  let promise = new Promise((resolve, reject) => {
    chrome.cookies.getAll({url: url}, (cookies) => resolve(cookies));
  }) 
  return promise;
}

$(document).ready(function(){

  
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    var tab_url = tabs[0].url;

    // display cookies
    $(".show-tab").on("click", function(){
      getCookies(tab_url).then((cookies_) => {
        cookies = cookies_;
        
        $(".cookies_container").html("");
        for(var i=0; i < cookies.length; i++){
          var cookie = cookies[i];
          $(".cookies_container").append(`
            <li class="cookie">
              <div class="cookie_header" data-toggle="collapse" href="#${cookie.name}body"><img src="assets/down-arrow.svg" alt="" class="header-icon">${cookie.name}</div>
              <div id="${cookie.name}body" class="collapse cookie_body">
                  <table class="table">
                      <tbody>
                        <tr>
                          <th scope="row">name</th>
                          <td>${cookie.name}</td>
                        </tr>
                        <tr>
                          <th scope="row">value</th>
                          <td>${cookie.value}</td>
                        </tr>
                        <tr>
                          <th scope="row">domain</th>
                          <td>${cookie.domain}</td>
                        </tr>
                        <tr>
                          <th scope="row">expiration date</th>
                          <td>${cookie.expirationDate}</td>
                        </tr>
                        <tr>
                          <th scope="row">same site</th>
                          <td>${cookie.sameSite}</td>
                        </tr>
                        <tr>
                          <th scope="row">httpOnly</th>
                          <td>${cookie.httpOnly}</td>
                        </tr>
                        <tr>
                          <th scope="row">path</th>
                          <td>${cookie.path}</td>
                        </tr>
                        <tr>
                          <th scope="row">storeId</th>
                          <td>${cookie.storeId}</td>
                        </tr>
                      </tbody>
                  </table>
                  <button class="copy_cookie_btn btn btn-sm btn-info" data-cookie-index="${i}"><img class="btn-icon" src="assets/copy.svg" alt=""> copy</button>
                  <button class="delete_cookie_btn btn btn-sm btn-danger" data-cookie-index="${i}"><img src="assets/remove.svg" class="btn-icon" alt=""> delete</button>
              </div>
            </li>
          `);
        }
    
        $(".copy_cookie_btn").on("click", function(){
          var $cookie_index = $(this).attr("data-cookie-index");
          var cookie = cookies[parseInt($cookie_index, 10)];
          navigator.clipboard.writeText(JSON.stringify(cookie)).then(function() {
            setTimeout(function() { alert("cookie copied to clipboard"); }, 1);
          }, function(err) {
            alert("oops! some error occured retry agian.")
          });
        })
    
        $(".delete_cookie_btn").on("click", function(){
          var cookie_index = parseInt($(this).attr("data-cookie-index"), 10);
          var cookie = cookies[cookie_index];
          var del = confirm(`Sure want to delete ${cookie.name}`);
          if(del){
            chrome.cookies.remove({url: tab_url, name: cookie.name}, function(){
              $(".show-tab").click();
            })
          }
        })
      })
    })

    // add cookies
    $("#add-cookie-form").on("submit", function(event){
      event.preventDefault();
      var cookie = this.children[0].value;
      try{
        cookie = JSON.parse(cookie);
        cookie['url'] = tab_url;
        delete cookie['hostOnly'];
        delete cookie['session'];
        try{
          chrome.cookies.set(cookie, function(cookie){
            alert(`${cookie.name} is set!`);
            $("#add-cookie-form").children()[0].value = "";
            $(".show-tab").click();
          })
        }catch(err){
          if(err.name == "TypeError"){
            alert(`invalid field in the cookie.`);
          }
        }
      }
      catch(err){
        if(err.name == "SyntaxError"){
          alert(`Oops! Something went wrong. Try again. \nError: ${err.message}`);
        }
      }
    })

    // remove cookies
    $(".rmv-tab").on("click", function(){
      getCookies(tab_url).then((cookies_) => {
        cookies = cookies_;
        $(".available-cookies").html("<ul>");
        for(var i=0; i < cookies.length; i++){
          $(".available-cookies").append(`<li>${cookies[i].name}</li>`);
        }
        $(".available-cookies").append("</ul>");
        // remove cookies
        $("#rmv-cookie-form").on("submit", function(event){
          var form = $(this);
          event.preventDefault();
          var cookie_name = $(form).children()[0].value;
            chrome.cookies.get({name: cookie_name, url: tab_url}, function(cookie){
              if(cookie != undefined){
                try{
                  chrome.cookies.remove({name: cookie_name, url: tab_url}, function(cookie){
                    alert(`${cookie.name} is removed successfully!`)
                    $("#rmv-cookie-form").children()[0].value = "";
                    $(".rmv-tab").click();
                    
                  })
                }catch(err){
                  alert("oops! something went wrong. Try again.");
                }
              }else{ alert("please provide a valid cookie name!"); }
          })
        })
      })
    })

    // share cookies
    $("#shr-cookies-form").on("submit", function (event) {
      event.preventDefault();
      getCookies(tab_url).then((cookies_) => {
        cookies = cookies_;
        var duration_ = {
          "m": 60,
          "h": 3600,
          "d": 86400,
          "w": 604800,
          "M": 2592000 
        }
        const duration = parseInt($("#duration").val(), 10);
        const duration_unit = $("#duration-unit").val();
        var date = (Date.now() / 1000) + duration*(duration_[duration_unit])  ;
        
        var temp_cookies = [];
        for(var i=0; i < cookies.length; i++){
          var temp_cookie = cookies[i];
          temp_cookie.expirationDate = date;
          temp_cookies.push(temp_cookie);
        }
        navigator.clipboard.writeText(JSON.stringify(temp_cookies)).then(function() {
          setTimeout(function() { 
            alert("cookies copied to clipboard");
            $("#duration").val("0");
          }, 1);
        }, function(err) {
          alert("oops! some error occured retry agian.")
        });
      })
    })

    // import cookies
    $("#imprt-cookies-form").on("submit", function(event){
      event.preventDefault();
      var imported_cookies = JSON.parse(this.children[0].value);
      var promises = [];
      for(var i=0; i < imported_cookies.length; i++){
        let cookie = imported_cookies[i];
        // adding url
        cookie['url'] = tab_url;
        // removing secureSite, hostOnly
        delete cookie['hostOnly'];
        delete cookie['session'];
        promises.push(new Promise((resolve, reject) => {
          chrome.cookies.set(cookie, () => {resolve();});
        }))
      }
      
      Promise.all(promises).then(function(){
        $("#imprt-cookies-form").children()[0].value = "";
        $(".show-tab").click();
      })
    
    })

    // clear cookies
    $(".clr-btn").on("click", function(){
      var clr = confirm("Sure want to clear all the cookies?");
      if(clr){
        getCookies(tab_url).then((cookies_) => {
          cookies = cookies_;

          // code for clearing cookies
          var promises = [];
          for(var i=0; i < cookies.length; i++){
            promises.push(new Promise((resolve, reject) => {
              chrome.cookies.remove({name: cookies[i].name, url: tab_url}, () => {resolve();});
            }))
          }
          
          Promise.all(promises).then(function(){
            $(".show-tab").click();
          })
        })
      }
    })
  })
})

