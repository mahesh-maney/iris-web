import $ from 'jquery';
global.$ = global.jQuery = $;

import 'jquery-ui';
import showdown from 'showdown';
import Popover from 'bootstrap';
import { filterXSS } from 'xss';
import swal from 'sweetalert';
import html2canvas from 'html2canvas';
import ace from 'ace-builds';



$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};


var jdata_menu_options = [];

export function clear_api_error() {
   $(".invalid-feedback").hide();
}

export function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

export function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
export function eraseCookie(name) {
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

export function setOnClickEventFromMap(map, namespace) {
    for (let element in map) {
        console.log(element);
        console.log(map[element]);
        $(element).on(`click.${namespace}`, map[element]);
    }
}

export function unsetOnClickEventFromMap(map, namespace) {
    for (let element in map) {
        $(element).off(`click.${namespace}`);
    }
}

export function ellipsis_field( data, cutoff, wordbreak ) {

    data = data.toString();

    if ( data.length <= cutoff ) {
        return filterXSS( data );
    }

    var shortened = data.substr(0, cutoff-1);

    // Find the last white space character in the string
    if ( wordbreak ) {
        shortened = shortened.replace(/\s([^\s]*)$/, '');
    }

    shortened = filterXSS( shortened );

    return '<div class="ellipsis" title="'+filterXSS(data)+'">'+shortened+'&#8230;</div>';
}

export function propagate_form_api_errors(data_error) {

    if (typeof (data_error) === typeof (' ')) {
        notify_error(data_error);
        return;
    }

    for (let e in data_error) {
        if($("#" + e).length !== 0) {
            $("#" + e).addClass('is-invalid');
            let errors = ""
            for (let n in data_error[e]) {
                    errors += data_error[e][n];
                }
            if($("#" + e + "-invalid-msg").length !== 0) {
                $("#" + e + "-invalid-msg").remove();
            }
            $("#" + e).after("<div class='invalid-feedback' id='" + e + "-invalid-msg'>" + errors +"</div>");
            $("#" + e + "-invalid-msg").show();
        }
        else {
            let msg = e + " - ";
            for (let n in data_error[e]) {
                    msg += data_error[e][n];
            }
            notify_error(msg);
        }
    }
}

export function ajax_notify_error(jqXHR, url) {
    let message = '';
    if (jqXHR.status == 403) {
        message = 'Permission denied';
    } else {
        message = `We got error ${jqXHR.status} - ${jqXHR.statusText} requesting ${url}`;
    }
    notify_error(message);
}

export function notify_error(message) {

    let data = "";
    if (typeof (message) == typeof ([])) {
        for (let element in message) {
            data += element
        }
    } else {
        data = message;
    }
    data = '<p>' + sanitizeHTML(data) + '</p>';
    $.notify({
        icon: 'fas fa-triangle-exclamation',
        message: data,
        title: 'Error'
    }, {
        type: 'danger',
        placement: {
            from: 'bottom',
            align: 'left'
        },
        z_index: 2000,
        timer: 8000,
        animate: {
            enter: 'animated fadeIn',
            exit: 'animated fadeOut'
        }
    });
}

export function notify_success(message) {
    message = '<p>' + sanitizeHTML(message) + '</p>';
    $.notify({
        icon: 'fas fa-check',
        message: message
    }, {
        type: 'success',
        placement: {
            from: 'bottom',
            align: 'left'
        },
        z_index: 2000,
        timer: 2500,
        animate: {
            enter: 'animated fadeIn',
            exit: 'animated fadeOut'
        }
    });
}

export function notify_warning(message) {
    message = '<p>' + sanitizeHTML(message) + '</p>';
    $.notify({
        icon: 'fas fa-exclamation',
        message: message
    }, {
        type: 'warning',
        placement: {
            from: 'bottom',
            align: 'left'
        },
        z_index: 2000,
        timer: 2500,
        animate: {
            enter: 'animated fadeIn',
            exit: 'animated fadeOut'
        }
    });
}

export function notify_auto_api(data, silent_success) {
    if (data.status === 'success') {
        if (silent_success === undefined || silent_success === false) {
            if (data.message.length === 0) {
                data.message = 'Operation succeeded';
            }
            notify_success(data.message);
        }
        return true;
    } else {
        if (data.message.length === 0) {
            data.message = 'Operation failed';
        }
        notify_error(data.message);
        return false;
    }
}

export function get_request_api(uri, propagate_api_error, beforeSend_fn, cid) {
    if (cid === undefined ) {
     cid = case_param();
    } else {
     cid = '?cid=' + cid;
    }

    uri = uri + cid;
    return get_raw_request_api(uri, propagate_api_error, beforeSend_fn)
}

export function get_raw_request_api(uri, propagate_api_error, beforeSend_fn) {
    return $.ajax({
        url: uri,
        type: 'GET',
        dataType: "json",
        beforeSend: function(jqXHR, settings) {
            if (beforeSend_fn !== undefined && beforeSend_fn !== null) {
                beforeSend_fn(jqXHR, settings);
            }
        },
        error: function(jqXHR) {
            if (propagate_api_error) {
                if(jqXHR.responseJSON && jqXHR.status == 400) {
                    propagate_form_api_errors(jqXHR.responseJSON.data);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            } else {
                if(jqXHR.responseJSON) {
                    notify_error(jqXHR.responseJSON.message);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            }
        }
    });
}

export function set_page_warning(msg) {
    $('#page_warning').text(msg);
}

export function get_request_data_api(uri, data, propagate_api_error, beforeSend_fn) {
    return $.ajax({
        url: uri + case_param(),
        type: 'GET',
        data: data,
        dataType: "json",
        beforeSend: function(jqXHR, settings) {
            if (beforeSend_fn !== undefined) {
                beforeSend_fn(jqXHR, settings);
            }
        },
        error: function(jqXHR) {
            if (propagate_api_error) {
                if(jqXHR.responseJSON && jqXHR.status == 400) {
                    propagate_form_api_errors(jqXHR.responseJSON.data);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            } else {
                if(jqXHR.responseJSON) {
                    notify_error(jqXHR.responseJSON.message);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            }
        }
    });
}

export function post_request_api(uri, data, propagate_api_error, beforeSend_fn, cid) {
   if (cid === undefined ) {
     cid = case_param();
   } else {
     cid = '?cid=' + cid;
   }

   if (data === undefined || data === null) {
        data = JSON.stringify({
            'csrf_token': $('#csrf_token').val()
        });
   }

   return $.ajax({
        url: uri + cid,
        type: 'POST',
        data: data,
        dataType: "json",
        contentType: "application/json;charset=UTF-8",
        beforeSend: function(jqXHR, settings) {
            if (typeof beforeSend_fn === 'function') {
                beforeSend_fn(jqXHR, settings);
            }
        },
        error: function(jqXHR) {
            if (propagate_api_error) {
                if(jqXHR.responseJSON && jqXHR.status == 400) {
                    propagate_form_api_errors(jqXHR.responseJSON.data);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            } else {
                if(jqXHR.responseJSON) {
                    notify_error(jqXHR.responseJSON.message);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            }
        }
    });
}

export function post_request_data_api(uri, data, propagate_api_error, beforeSend_fn) {
   return $.ajax({
        url: uri + case_param(),
        type: 'POST',
        data: data,
        dataType: "json",
        contentType: false,
        processData: false,
        beforeSend: function(jqXHR, settings) {
            if (beforeSend_fn !== undefined) {
                beforeSend_fn(jqXHR, settings);
            }
        },
        error: function(jqXHR) {
            if (propagate_api_error) {
                if(jqXHR.responseJSON && jqXHR.status == 400) {
                    propagate_form_api_errors(jqXHR.responseJSON.data);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            } else {
                if(jqXHR.responseJSON) {
                    notify_error(jqXHR.responseJSON.message);
                } else {
                    ajax_notify_error(jqXHR, this.url);
                }
            }
        }
    });
}

export function updateURLParameter(url, param, paramVal) {
    var TheAnchor = null;
    var newAdditionalURL = "";
    var tempArray = url.split("?");
    var baseURL = tempArray[0];
    var additionalURL = tempArray[1];
    var temp = "";
    var tmpAnchor = null;
    var TheParams = null;

    if (additionalURL)
    {
        tmpAnchor = additionalURL.split("#");
        TheParams = tmpAnchor[0];
            TheAnchor = tmpAnchor[1];
        if(TheAnchor)
            additionalURL = TheParams;

        tempArray = additionalURL.split("&");

        for (var i=0; i<tempArray.length; i++)
        {
            if(tempArray[i].split('=')[0] != param)
            {
                newAdditionalURL += temp + tempArray[i];
                temp = "&";
            }
        }
    }
    else
    {
        tmpAnchor = baseURL.split("#");
        TheParams = tmpAnchor[0];
            TheAnchor  = tmpAnchor[1];

        if(TheParams)
            baseURL = TheParams;
    }

    if(TheAnchor)
        paramVal += "#" + TheAnchor;

    var rows_txt = temp + "" + param + "=" + paramVal;
    return baseURL + "?" + newAdditionalURL + rows_txt;
}

export function get_caseid() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    return urlParams.get('cid')
}

export function is_redirect() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    return urlParams.get('redirect')
}

export function notify_redirect() {
    if (is_redirect()) {
        swal("You've been redirected",
             "The case you attempted to reach wasn't found.\nYou have been redirected to a default case.",
             "info", {button: "OK"}
             ).then(() => {
                    let queryString = window.location.search;
                    let urlParams = new URLSearchParams(queryString);
                    urlParams.delete('redirect');
                    history.replaceState(null, null, window.location.pathname + '?' + urlParams.toString());
                });
    }
}

export function case_param() {
    var params = {
        cid: get_caseid
    }
    return '?'+ $.param(params);
}

var last_state = null;
var need_check = true;
export function update_last_resfresh() {
    need_check = true;
    $('#last_resfresh').text("").removeClass("text-warning");
}

export function check_update(url) {
    if (need_check) {
        $.ajax({
            url: url + case_param(),
            type: "GET",
            dataType: "json",
            success: function (data) {
                    if (last_state == null || last_state < data.data.object_state) {
                        $('#last_resfresh').text("Updates available").addClass("text-warning");
                        need_check = false;
                    }
                },
            error: function (data) {
                if (data.status == 404) {
                    swal("Stop everything !",
                    "The case you are working on was deleted",
                    "error",
                    {
                        buttons: {
                            again: {
                                text: "Go to my default case",
                                value: "default"
                            }
                        }
                    }
                    ).then((value) => {
                        switch (value) {
                            case "dash":
                                location.reload();
                                break;

                            default:
                                location.reload();
                        }
                    });
                } else if (data.status == 403) {
                    window.location.replace("/case" + case_param());
                } else if (data.status == 400) {
                    console.log('Bad request logged - standard error message');
                } else {
                    notify_error('Connection with server lost');
                }
            }
        });
    }
}

export function set_last_state(state){
    if (state != null) {
        last_state = state.object_state;
    }
    update_last_resfresh();
}

export function show_loader() {
    $('#loading_msg').show();
    $('#card_main_load').hide();
}

export function hide_loader() {
    $('#loading_msg').hide();
    $('#card_main_load').show();
    update_last_resfresh();
}

export function list_to_badges(wordlist, style, limit, type) {
    let badges = "";
    if (wordlist.length > limit) {
       badges = `<span class="badge badge-${style} ml-2">${wordlist.length} ${type}</span>`;
    }
    else {
        wordlist.forEach(function (item) {
            badges += `<span class="badge badge-${style} ml-2">${sanitizeHTML(item)}</span>`;
        });
    }

    return badges;
}

export var sanitizeHTML = function (str, options) {
    if (options) {
        return filterXSS(str, options);
    } else {
        return filterXSS(str);
    }
};

export function isWhiteSpace(s) {
  return /^\s+$/.test(s);
}

export function exportInnerPng() {
    let close_sid_var = document.querySelector(".close-quick-sidebar");
    close_sid_var.click();
    let div = document.querySelector(".page-inner");
    html2canvas(div, {
        useCORS: true,
        scale: 3,
        backgroundColor: "#f9fbfd"
        }).then(canvas => {
        downloadURI(canvas.toDataURL(), 'iris'+location.pathname.replace('/', '_') + '.png')
    });
}

export function downloadURI(uri, name) {
    var link = document.createElement("a");

    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

export function buildShareLink(lookup_id) {
    let current_path = location.protocol + '//' + location.host + location.pathname;
    current_path = current_path + case_param() + '&shared=' + lookup_id;

    return current_path;
}

export function copy_object_link(node_id) {
    let link = buildShareLink(node_id);
    navigator.clipboard.writeText(link).then(function() {
          notify_success('Shared link copied');
    }, function(err) {
        notify_error('Can\'t copy link. I printed it in console.');
        console.error('Shared link', err);
    });
}
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function copy_object_link_md(data_type, node_id){
    let link = `[<i class="fa-solid fa-tag"></i> ${capitalizeFirstLetter(data_type)} #${node_id}](${buildShareLink(node_id)})`
    navigator.clipboard.writeText(link).then(function() {
        notify_success('MD link copied');
    }, function(err) {
        notify_error('Can\'t copy link. I printed it in console.');
        console.error('Shared link', err);
    });
}

export function load_case_activity(){
    get_request_api('/case/activities/list')
    .done((data) => {
        let js_data = data.data;
        let api_flag = '';
        let title = '';

        $('#case_activities').empty();
        for (let index in js_data) {

            if (js_data[index].is_from_api) {
                api_flag = 'feed-item-primary';
                title = 'Activity issued from API';
            } else {
                api_flag = 'feed-item-default';
                title = 'Activity issued from GUI';
            }

            let entry =	`<li class="feed-item ${api_flag}" title='${sanitizeHTML(title)}'>
                    <time class="date" datetime="${js_data[index].activity_date}">${js_data[index].activity_date}</time>
                    <span class="text">${sanitizeHTML(js_data[index].name)} - ${sanitizeHTML(js_data[index].activity_desc)}</span>
                    </li>`
            $('#case_activities').append(entry);
        }
    });
}

export function load_dim_limited_tasks(){
    get_request_api('/dim/tasks/list/100')
    .done((data) => {
        let js_data = data.data;
        let api_flag = '';
        let title = '';

        $('#dim_tasks_feed').empty();
        for (let index in js_data) {

            if (js_data[index].state == 'success') {
                api_flag = 'feed-item-success';
                title = 'Task succeeded';
            } else {
                api_flag = 'feed-item-warning';
                title = 'Task pending or failed';
            }

            let entry =	`<li class="feed-item ${api_flag}" title='${title}'>
                    <time class="date" datetime="${js_data[index].activity_date}">${js_data[index].date_done}</time>
                    <span class="text" title="${js_data[index].task_id}"><a href="#" onclick='dim_task_status("${js_data[index].task_id}");return false;'>${js_data[index].module}</a> - ${js_data[index].user}</span>
                    </li>`
            $('#dim_tasks_feed').append(entry);
        }
    });
}

export function dim_task_status(id) {
    const url = '/dim/tasks/status/'+id + case_param();
    $('#info_dim_task_modal_body').load(url, function (response, status, xhr) {
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }
        $('#modal_dim_task_detail').modal({show:true});
    });
}

export function init_module_processing_wrap(rows, data_type, out_hook_name) {
    console.log(out_hook_name);
    let hook_name = null;
    let hook_ui_name = null;
    let module_name = null;

    for (let opt in jdata_menu_options) {
        console.log(jdata_menu_options[opt]);
        if (jdata_menu_options[opt].manual_hook_ui_name == out_hook_name) {
            hook_name = jdata_menu_options[opt].hook_name;
            hook_ui_name = jdata_menu_options[opt].manual_hook_ui_name;
            module_name = jdata_menu_options[opt].module_name;
            break
        }
    }
    if (hook_name == null) {
        notify_error('Error: hook not found');
        return false;
    }
    return init_module_processing(rows, hook_name, hook_ui_name, module_name, data_type);
}

export function init_module_processing(rows, hook_name, hook_ui_name, module_name, data_type) {
    var data = Object();
    data['hook_name'] = hook_name;
    data['module_name'] = module_name;
    data['hook_ui_name'] = hook_ui_name;
    data['csrf_token'] = $('#csrf_token').val();
    data['type'] = data_type;
    data['targets'] = [];

    let type_map = {
        "ioc": "ioc_id",
        "asset": "asset_id",
        "task": "task_id",
        "global_task": "task_id",
        "evidence": "id"
    }

    for (let index in rows) {
        if (typeof rows[index] === 'object') {
            data['targets'].push(rows[index][type_map[data_type]]);
        } else {
            data['targets'].push(rows[index]);
        }
    }

    post_request_api("/dim/hooks/call", JSON.stringify(data), true)
    .done(function (data){
        notify_auto_api(data)
    });
}

export function load_menu_mod_options_modal(element_id, data_type, anchor) {
    get_request_api('/dim/hooks/options/'+ data_type +'/list')
    .done(function (data){
        if(notify_auto_api(data, true)) {
            if (data.data != null) {
                let jsdata = data.data;
                if (jsdata.length != 0) {
                    anchor.append('<div class="dropdown-divider"></div>');
                }
                let opt = null;
                let menu_opt = null;

                for (let option in jsdata) {
                    opt = jsdata[option];
                    menu_opt = `<a class="dropdown-item" href="#" onclick='init_module_processing(["${element_id}"], "${opt.hook_name}",`+
                                `"${opt.manual_hook_ui_name}","${opt.module_name}","${data_type}");return false;'><i class="fa fa-arrow-alt-circle-right mr-2"></i> ${opt.manual_hook_ui_name}</a>`
                    anchor.append(menu_opt);
                }

            }
        }
    })
}

export function get_row_id(row) {
    const ids_map = ["ioc_id","asset_id","task_id","id"];
    for (let id in ids_map) {
        if (row[ids_map[id]] !== undefined) {
            return row[ids_map[id]];
        }
    }
    return null;
}

var iClassWhiteList = ['fa-solid fa-tags','fa-solid fa-tag', 'fa-solid fa-bell', 'fa-solid fa-virus-covid text-danger mr-1',
'fa-solid fa-file-shield text-success mr-1', 'fa-regular fa-file mr-1', 'fa-solid fa-lock text-success mr-1']

export function get_new_ace_editor(anchor_id, content_anchor, target_anchor, onchange_callback, do_save, readonly, live_preview) {
    var editor = ace.edit(anchor_id);
    if ($("#"+anchor_id).attr("data-theme") != "dark") {
        editor.setTheme("ace/theme/tomorrow");
    } else {
        editor.setTheme("ace/theme/iris_night");
    }
    editor.session.setMode("ace/mode/markdown");
    if (readonly !== undefined) {
        editor.setReadOnly(readonly);
    }
    editor.renderer.setShowGutter(true);
    editor.setOption("showLineNumbers", true);
    editor.setOption("showPrintMargin", false);
    editor.setOption("displayIndentGuides", true);
    editor.setOption("maxLines", "Infinity");
    editor.setOption("minLines", "2");
    editor.setOption("autoScrollEditorIntoView", true);
    editor.session.setUseWrapMode(true);
    editor.setOption("indentedSoftWrap", false);
    editor.renderer.setScrollMargin(8, 5)
    editor.setOption("enableBasicAutocompletion", true);

    if (do_save !== undefined && do_save !== null) {
        editor.commands.addCommand({
            name: 'save',
            bindKey: {win: "Ctrl-S", "mac": "Cmd-S"},
            exec: function() {
                do_save()
            }
        });
    }

    editor.commands.addCommand({
        name: 'bold',
        bindKey: {win: "Ctrl-B", "mac": "Cmd-B"},
        exec: function(editor) {
            editor.insertSnippet('**${1:$SELECTION}**');
        }
    });
    editor.commands.addCommand({
        name: 'italic',
        bindKey: {win: "Ctrl-I", "mac": "Cmd-I"},
        exec: function(editor) {
            editor.insertSnippet('*${1:$SELECTION}*');
        }
    });
    editor.commands.addCommand({
        name: 'head_1',
        bindKey: {win: "Ctrl-Shift-1", "mac": "Cmd-Shift-1"},
        exec: function(editor) {
            editor.insertSnippet('# ${1:$SELECTION}');
        }
    });
    editor.commands.addCommand({
        name: 'head_2',
        bindKey: {win: "Ctrl-Shift-2", "mac": "Cmd-Shift-2"},
        exec: function(editor) {
            editor.insertSnippet('## ${1:$SELECTION}');
        }
    });
    editor.commands.addCommand({
        name: 'head_3',
        bindKey: {win: "Ctrl-Shift-3", "mac": "Cmd-Shift-3"},
        exec: function(editor) {
            editor.insertSnippet('### ${1:$SELECTION}');
        }
    });
    editor.commands.addCommand({
        name: 'head_4',
        bindKey: {win: "Ctrl-Shift-4", "mac": "Cmd-Shift-4"},
        exec: function(editor) {
            editor.insertSnippet('#### ${1:$SELECTION}');
        }
    });

    if (live_preview === undefined || live_preview === true) {
        let textarea = $('#'+content_anchor);
        editor.getSession().on("change", function () {
            if (onchange_callback !== undefined && onchange_callback !== null) {
                onchange_callback();
            }

            textarea.text(editor.getSession().getValue());
            let target = document.getElementById(target_anchor);
            let converter = get_showdown_convert();
            let html = converter.makeHtml(editor.getSession().getValue());
            target.innerHTML = do_md_filter_xss(html);

        });

        textarea.text(editor.getSession().getValue());
        let target = document.getElementById(target_anchor);
        let converter = get_showdown_convert();
        let html = converter.makeHtml(editor.getSession().getValue());
        target.innerHTML = do_md_filter_xss(html);

    }

    return editor;
}

export function createSanitizeExtensionForImg() {
  return [
    {
      type: 'lang',
      regex: /<.*?>/g,
      replace: function (match) {
        if (match.startsWith('<img')) {
          return match.replace(/on\w+="[^"]*"/gi, '');
        }
        return '';
      },
    },
  ];
}


export function get_showdown_convert() {
    return new showdown.Converter({
        tables: true,
        parseImgDimensions: true,
        emoji: true,
        smoothLivePreview: true,
        strikethrough: true,
        tasklists: true,
        extensions: ['bootstrap-tables', createSanitizeExtensionForImg()]
    });
}

export function do_md_filter_xss(html) {
    return filterXSS(html, {
        stripIgnoreTag: false,
        whiteList: {
                i: ['class', "title"],
                a: ['href', 'title', 'target'],
                img: ['src', 'alt', 'title', 'width', 'height'],
                div: ['class'],
                p: [],
                hr: [],
                h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
                ul: [], ol: [], li: [],
                code: [], pre: [], em: [], strong: [],
                blockquote: [], del: [],
                input: ['type', 'checked', 'disabled', 'class'],
                table: ['class'], thead: [], tbody: [], tr: [], th: [], td: []
            },
        onTagAttr: function (tag, name, value) {
            if (tag === "i" && name === "class") {
                if (iClassWhiteList.indexOf(value) === -1) {
                    return false;
                } else {
                    return name + '="' + value + '"';
                }
            }
          }
        });
}

const avatarCache = {};

export function get_avatar_initials(name, small, onClickFunction) {
    const av_size = small ? 'avatar-sm' : 'avatar';
    const onClick = onClickFunction ? `onclick="${onClickFunction}"` : '';

    if (avatarCache[name] && avatarCache[name][small ? 'small' : 'large']) {
        return `<div class="avatar ${av_size}" title="${name}" ${onClick}>
            ${avatarCache[name][small ? 'small' : 'large']}
        </div>`;
    }

    const initial = name.split(' ');
    let snum;

    if (initial.length > 1) {
        snum = initial[0][0].charCodeAt(0) + initial[1][0].charCodeAt(0);
    } else {
        snum = initial[0][0].charCodeAt(0);
    }

    const initials = initial.map(i => i[0].toUpperCase()).join('');
    const avatarColor = get_avatar_color(snum);

    const avatarHTMLin = `<span class="avatar-title avatar-iris rounded-circle" style="background-color:${avatarColor}; cursor:pointer;">${initials}</span>`
    const avatarHTMLout = `<div class="avatar ${av_size}" title="${name}" ${onClick}>
        ${avatarHTMLin}
    </div>`;

    if (!avatarCache[name]) {
        avatarCache[name] = {};
    }
    avatarCache[name][small ? 'small' : 'large'] = avatarHTMLin;

    return avatarHTMLout;
}

export function get_avatar_color(snum) {
    const hue = snum * 137.508 % 360; // Use the golden angle for more distinct colors
    const saturation = 40 + (snum % 20); // Saturation range: 40-60
    const lightness = 55 + (snum % 10); // Lightness range: 70-80

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}


export function edit_inner_editor(btn_id, container_id, ctrd_id) {
    $('#'+container_id).toggle();
    if ($('#'+container_id).is(':visible')) {
        $('#'+btn_id).show(100);
        $('#'+ctrd_id).removeClass('col-md-12').addClass('col-md-6');
    } else {
        $('#'+btn_id).hide(100);
        $('#'+ctrd_id).removeClass('col-md-6').addClass('col-md-12');
    }
    return false;
}

export function get_editor_headers(editor_instance, save) {
    var save_html = `<div class="btn btn-sm btn-light mr-1 " title="CTRL-S" id="last_saved" onclick="${save}( this );"><i class="fa-solid fa-file-circle-check"></i></div>`;
    if (save === undefined || save === null) {
        save_html = '';
    }
    let header = `
                ${save_html}
                <div class="btn btn-sm btn-light mr-1 " title="CTRL-B" onclick="${editor_instance}.insertSnippet`+"('**${1:$SELECTION}**');"+`${editor_instance}.focus();"><i class="fa-solid fa-bold"></i></div>
                <div class="btn btn-sm btn-light mr-1" title="CTRL-I" onclick="${editor_instance}.insertSnippet`+"('*${1:$SELECTION}*');"+`${editor_instance}.focus();"><i class="fa-solid fa-italic"></i></div>
                <div class="btn btn-sm btn-light mr-1" title="CTRL-SHIFT-1" onclick="${editor_instance}.insertSnippet`+"('# ${1:$SELECTION}');"+`${editor_instance}.focus();">H1</div>
                <div class="btn btn-sm btn-light mr-1" title="CTRL-SHIFT-2" onclick="${editor_instance}.insertSnippet`+"('## ${1:$SELECTION}')"+`;${editor_instance}.focus();">H2</div>
                <div class="btn btn-sm btn-light mr-1" title="CTRL-SHIFT-3" onclick="${editor_instance}.insertSnippet`+"('### ${1:$SELECTION}');"+`${editor_instance}.focus();">H3</div>
                <div class="btn btn-sm btn-light mr-1" title="CTRL-SHIFT-4" onclick="${editor_instance}.insertSnippet`+"('#### ${1:$SELECTION}');"+`${editor_instance}.focus();">H4</div>
                <div class="btn btn-sm btn-light mr-1" title="Insert code" onclick="${editor_instance}.insertSnippet`+"('```${1:$SELECTION}```');"+`${editor_instance}.focus();"><i class="fa-solid fa-code"></i></div>
                <div class="btn btn-sm btn-light mr-1" title="Insert link" onclick="${editor_instance}.insertSnippet`+"('[New link](${1:$SELECTION})');"+`${editor_instance}.focus();"><i class="fa-solid fa-link"></i></div>
                <div class="btn btn-sm btn-light mr-1" title="Insert table" onclick="${editor_instance}.insertSnippet`+"('|\\t|\\t|\\t|\\n|--|--|--|\\n|\\t|\\t|\\t|\\n|\\t|\\t|\\t|');"+`${editor_instance}.focus();"><i class="fa-solid fa-table"></i></div>
                <div class="btn btn-sm btn-light mr-1" title="Insert bullet list" onclick="${editor_instance}.insertSnippet`+"('\\n- \\n- \\n- ');"+`${editor_instance}.focus();"><i class="fa-solid fa-list"></i></div>
                <div class="btn btn-sm btn-light mr-1" title="Insert numbered list" onclick="${editor_instance}.insertSnippet`+"('\\n1. a  \\n2. b  \\n3. c  ');"+`${editor_instance}.focus();"><i class="fa-solid fa-list-ol"></i></div>
    `
    return header;
}

export function goto_case_number() {
    const case_id = $('#goto_case_number_input').val();
    if (case_id !== '' && isNaN(case_id) === false) {

        get_request_api('/case/exists', true, null, case_id)
        .done(function (data){
            if(notify_auto_api(data, true)) {
                var url = new window.URL(document.location);
                url.searchParams.set("cid", case_id);
                window.location.href = url.href;
            }
        });

    }
}

let comment_element = function(){};

export function load_menu_mod_options(data_type, table, deletion_fn) {
    var actionOptions = {
        classes: [],
        contextMenu: {
            enabled: true,
            isMulti: true,
            xoffset: -10,
            yoffset: -10,
            headerRenderer: function (rows) {
                if (rows.length > 1) {
                    return rows.length + ' items selected';
                } else {
                    // let row = rows[0];
                    return 'Quick action';
                }
            },
        },
        buttonList: {
            enabled: false,
        },
        deselectAfterAction: true,
        items: [],
    };

    const datatype_map = {
        'task': 'tasks',
        'ioc': 'ioc',
        'evidence': 'evidences',
        'note': 'notes',
        'asset': 'assets',
        'event': 'timeline/events'
    }

    get_request_api("/dim/hooks/options/"+ data_type +"/list")
    .done((data) => {
        if(notify_auto_api(data, true)) {
            if (data.data != null) {
                let jsdata = data.data;

                actionOptions.items.push({
                    type: 'option',
                    title: 'Share',
                    multi: false,
                    iconClass: 'fas fa-share',
                    action: function(rows){
                        let row = rows[0];
                        copy_object_link(get_row_id(row));
                    }
                });

                actionOptions.items.push({
                    type: 'option',
                    title: 'Comment',
                    multi: false,
                    iconClass: 'fas fa-comments',
                    action: function(rows){
                        let row = rows[0];
                        if (data_type in datatype_map) {
                            comment_element(get_row_id(row), datatype_map[data_type]);
                        }
                    }
                });

                actionOptions.items.push({
                    type: 'option',
                    title: 'Markdown Link',
                    multi: false,
                    iconClass: 'fa-brands fa-markdown',
                    action: function(rows){
                        let row = rows[0];
                        copy_object_link_md(data_type, get_row_id(row));
                    }
                });

                actionOptions.items.push({
                    type: 'divider'
                });
                jdata_menu_options = jsdata;

                for (let option in jsdata) {
                    let opt = jsdata[option];

                    actionOptions.items.push({
                        type: 'option',
                        title: opt.manual_hook_ui_name,
                        multi: true,
                        multiTitle: opt.manual_hook_ui_name,
                        iconClass: 'fas fa-rocket',
                        contextMenuClasses: ['text-dark'],
                        action: function (rows, de) {
                            init_module_processing_wrap(rows, data_type, de[0].outerText);
                        },
                    })
                }

                if (deletion_fn !== undefined) {
                    actionOptions.items.push({
                        type: 'divider',
                    });

                    actionOptions.items.push({
                        type: 'option',
                        title: 'Delete',
                        multi: false,
                        iconClass: 'fas fa-trash',
                        contextMenuClasses: ['text-danger'],
                        action: function(rows){
                            let row = rows[0];
                            deletion_fn(get_row_id(row));
                        }
                    });
                }

                let tableActions = table.contextualActions(actionOptions);
                tableActions.update();
            }
        }
    })
}


export function get_custom_attributes_fields() {
    let values = Object();
    let has_error = [];
    $("input[id^='inpstd_']").each(function (i, el) {
        let tab = $(el).attr('data-ref-tab');
        let field = $(el).attr('data-attr-for');
        if (!(tab in values)) { values[tab] = {} }

        values[tab][field] = $(el).val();
        if ($(el).prop('required') && !values[tab][field]) {
            $(el).parent().addClass('has-error');
            has_error.push(field);
        } else {
             $(el).parent().removeClass('has-error');
        }
    })
    $("textarea[id^='inpstd_']").each(function (i, el) {
        let tab = $(el).attr('data-ref-tab');
        let field = $(el).attr('data-attr-for');
        if (!(tab in values)) { values[tab] = {} }
        values[tab][field] = $(el).val();
        if ($(el).prop('required') && !values[tab][field]) {
            $(el).parent().addClass('has-error');
            has_error.push(field);
        } else {
             $(el).parent().removeClass('has-error');
        }
    })
    $("input[id^='inpchk_']").each(function (i, el) {
        let tab = $(el).attr('data-ref-tab');
        let field = $(el).attr('data-attr-for');
        if (!(tab in values)) { values[tab] = {} }
        values[tab][field] = $(el).is(':checked');
    })
    $("select[id^='inpselect_']").each(function (i, el) {
        let tab = $(el).attr('data-ref-tab');
        let field = $(el).attr('data-attr-for');
        if (!(tab in values)) { values[tab] = {} }
        values[tab][field] = $(el).val();
        if ($(el).prop('required') && !values[tab][field]) {
            $(el).parent().addClass('has-error');
            has_error.push(field);
        } else {
             $(el).parent().removeClass('has-error');
        }
    })

    if (has_error.length > 0) {
        let msg = 'Missing required fields: <br/>';
        for (let field in has_error) {
            msg += '  - ' + has_error[field] + '<br/>';
        }
        notify_error(msg);
    }

    return [has_error, values];
}

export function update_time() {
    $('#current_date').text((new Date()).toLocaleString().slice(0, 17));
}

export function download_file(filename, contentType, data) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:' + contentType + ';charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

export function toggle_focus_mode() {
    let class_a = "bg-focus-gradient"
    $(".modal-case-focus").each(function (i, el)  {
        if ($(el).hasClass( class_a )) {
            $(el).removeClass(class_a, 1000);
        } else {
            $(el).addClass(class_a, 1000);
        }
    });
}

export function modal_maximize() {
    let id = $('#minimized_modal_box').data('target-id');
    $("#" + id).modal("show");
    $("#minimized_modal_box").hide();
}

export function modal_minimized(id, title) {
    $("#" + id).modal("hide");
    $("#minimized_modal_title").text(title);
    $('#minimized_modal_box').data('target-id',id);
    $("#minimized_modal_box").show();
}

export function hide_minimized_modal_box() {
    $("#minimized_modal_box").hide();
    $("#minimized_modal_title").text('');
    $('#minimized_modal_box').data('target-id','');
}

export function hide_table_search_input(columns) {
    for (let i=0; i<columns.length; i++) {
      if (columns[i]) {
        $('.filters th:eq(' + i + ')' ).show();
      } else {
        $('.filters th:eq(' + i + ')' ).hide();
      }
    }
  }

function load_context_switcher() {

    var options = {
            ajax: {
            url: '/context/search-cases'+ case_param(),
            type: 'GET',
            dataType: 'json'
        },
        locale: {
                emptyTitle: 'Select and Begin Typing',
                statusInitialized: '',
        },
        preprocessData: function (data) {
            return context_data_parser(data);
        },
        preserveSelected: false
    };


    get_request_api('/context/get-cases/100')
    .done((data) => {
        context_data_parser(data);
        $('#user_context').ajaxSelectPicker(options);
    });
}

function context_data_parser(data) {
    if(notify_auto_api(data, true)) {
        $('#user_context').empty();

        $('#user_context').append('<optgroup label="Opened" id="switch_case_opened_opt"></optgroup>');
        $('#user_context').append('<optgroup label="Closed" id="switch_case_closed_opt"></optgroup>');
        let ocs = data.data;
        let ret_data = [];
        for (let index in ocs) {
            let case_name = sanitizeHTML(ocs[index].name);
            let cs_name = sanitizeHTML(ocs[index].customer_name);
            ret_data.push({
                        'value': ocs[index].case_id,
                        'text': `${case_name} (${cs_name}) ${ocs[index].access}`
                    });
            if (ocs[index].close_date != null) {
                $('#switch_case_closed_opt').append(`<option value="${ocs[index].case_id}">${case_name} (${cs_name}) ${ocs[index].access}</option>`);
            } else {
                $('#switch_case_opened_opt').append(`<option value="${ocs[index].case_id}">${case_name} (${cs_name}) ${ocs[index].access}</option>`)
            }
        }

        $('#modal_switch_context').modal("show");
        $('#user_context').selectpicker('refresh');
        $('#user_context').selectpicker('val', get_caseid());
        return ret_data;

    }
}

export function focus_on_input_chg_case(){
    $('#goto_case_number_input').focus();
    $('#goto_case_number_input').keydown(function(event) {
        if (event.keyCode == 13) {
             goto_case_number();
             return false;
        }
  });
}

export function split_bool(split_str) {
    let and_split = split_str.split(' AND ');

    if (and_split[0]) {
      return and_split[0];
    }

    return null;
}

export function random_filename(length) {
    var filename           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var char_length = characters.length;
    for ( var i = 0; i < length; i++ ) {
      filename += characters.charAt(Math.random() * 1000 % char_length);
   }
   return filename;
}

export function createPagination(currentPage, totalPages, per_page, callback, paginationContainersNodes) {
  const maxPagesToShow = 5;
  const paginationContainers = $(paginationContainersNodes);

  if (totalPages === 1 || totalPages === 0) {
    paginationContainers.html('');
    return;
  }

  paginationContainers.each(function() {
    const paginationContainer = $(this);
    paginationContainer.html('');

    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Add First page button
      if (totalPages > maxPagesToShow) {
          if (currentPage !== 1 && maxPagesToShow / 2 + 1 < currentPage) {
              const firstItem = $('<li>', {class: 'page-item'}).appendTo(paginationContainer);
              $('<a>', {
                  href: `javascript:${callback}(1, ${per_page},{}, true)`,
                  text: 'First page',
                  class: 'page-link',
              }).appendTo(firstItem);
          }
      }

    // Add Previous button
    if (currentPage !== 1) {
        const prevItem = $('<li>', { class: 'page-item' }).appendTo(paginationContainer);
        $('<a>', {
          href: `javascript:${callback}(${Math.max(1, currentPage - 1)}, ${per_page},{}, true)`,
          text: 'Previous',
          class: 'page-link',
        }).appendTo(prevItem);
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      const pageItem = $('<li>', { class: 'page-item' }).appendTo(paginationContainer);
      if (i === currentPage) {
        pageItem.addClass('active');
      }
      $('<a>', {
        href: `javascript:${callback}(${i}, ${per_page},{}, true)`,
        text: i,
        class: 'page-link',
      }).appendTo(pageItem);
    }

    // Add Next button

    if (currentPage !== totalPages) {
        const nextItem = $('<li>', { class: 'page-item' }).appendTo(paginationContainer);
        $('<a>', {
          href: `javascript:${callback}(${Math.min(totalPages, currentPage + 1)}, ${per_page},{}, true)`,
          text: 'Next',
          class: 'page-link',
        }).appendTo(nextItem);
    }

   if (totalPages > maxPagesToShow) {
       if (currentPage !== totalPages) {
            const lastItem = $('<li>', {class: 'page-item'}).appendTo(paginationContainer);
            $('<a>', {
               href: `javascript:${callback}(${totalPages}, ${per_page},{}, true)`,
               text: 'Last page',
               class: 'page-link',
           }).appendTo(lastItem);
       }
   }
  });
}

let userWhoami = JSON.parse(sessionStorage.getItem('userWhoami'));

export function userWhoamiRequest(force = false) {
  if (!userWhoami || force) {
    get_request_api('/user/whoami')
      .done((data) => {
        if (notify_auto_api(data, true)) {
            userWhoami = data.data;
          sessionStorage.setItem('userWhoami', JSON.stringify(userWhoami));
        }
      });
  }
}

$('.toggle-sidebar').on('click', function() {
    if ($('.wrapper').hasClass('sidebar_minimize')) {
        $('.wrapper').removeClass('sidebar_minimize');
        get_request_api('/user/mini-sidebar/set/false')
            .then((data) => {
                notify_auto_api(data, true);
            });
    } else {
        $('.wrapper').addClass('sidebar_minimize');
        get_request_api('/user/mini-sidebar/set/true')
            .then((data) => {
                notify_auto_api(data, true);
            });
    }
});

export function do_deletion_prompt(message, force_prompt=false) {
    if (userWhoami.has_deletion_confirmation || force_prompt) {
            return new Promise((resolve, reject) => {
                swal({
                    title: "Are you sure?",
                    text: message,
                    icon: "warning",
                    buttons: {
                        cancel: {
                            text: "Cancel",
                            value: false,
                            visible: true,
                            closeModal: true
                        },
                        confirm: {
                           text: "Confirm",
                           value: true
                        }
                    },
                    dangerMode: true
                })
                .then((willDelete) => {
                    resolve(willDelete);
                })
                .catch((error) => {
                    reject(error);
                });
            });
    } else {
        return new Promise((resolve) => {
            resolve(true);
        });
    }
}

$(document).ready(function(){
    notify_redirect();
    update_time();
    setInterval(function() { update_time(); }, 30000);

    $(function () {
        var current = location.pathname;
        let btt = current.split('/')[1];

        if (btt !== 'manage') {
            btt = btt.split('?')[0];
        } else {
            let csp = current.split('?')[0].split('/')
            if (csp.length >= 3) {
                csp = csp.splice(0, 3);
            }
            btt = csp.join('/');
        }

        $('#l_nav_tab .nav-item').each(function (k, al) {
            let href = $(al).children().attr('href');
            let att = "";
            try {
                if (href == "#advanced-nav") {
                    $('#advanced-nav .nav-subitem').each(function (i, el) {
                        let ktt = $(el).children().attr('href').split('?')[0];
                        if (ktt === btt) {
                            $(el).addClass('active');
                            $(al).addClass('active');
                            $(al).children().attr('aria-expanded', true);
                            $('#advanced-nav').show();
                            return false;
                        }
                    });
                } else if (href.startsWith(btt)){
                    $(this).addClass('active');
                    return false;
                }else{
                    att = href.split('/')[1].split('?')[0];
                }
            } catch {att=""}
            if (att === btt) {
                $(al).addClass('active');
                return false;
            }
        })
    })

    $('#submit_set_context').on("click", function () {
    var data_sent = new Object();
    data_sent.ctx = $('#user_context').val();
    data_sent.ctx_h = $("#user_context option:selected").text();
    post_request_api('/context/set?cid=' + data_sent.ctx, data_sent)
    .done((data) => {
            if(notify_auto_api(data, true)) {
                $('#modal_switch_context').modal('hide');
                swal({
                    title: 'Context changed successfully',
                    text: 'Reloading...',
                    icon: 'success',
                    timer: 300,
                    buttons: false,
                })
                .then(() => {
                    var newURL = updateURLParameter(window.location.href, 'cid', data_sent.ctx);
                    window.history.replaceState('', '', newURL);
                    location.reload();
                })
            }
        });
    });

    $(".rotate").click(function () {
        $(this).toggleClass("down");
    });

    $(function () {
        // new Popover({selector: '[data-toggle="popover"]', trigger: 'focus', placement: 'auto', container: 'body', html: true});
        // $('[data-toggle="popover"]').popover({
        //     trigger: 'focus',
        //     placement: 'auto',
        //     container: 'body',
        //     html: true
        // });
    });

    $('.modal-dialog').draggable({
        handle: ".modal-header"
    });

    $('.switch-context-loader').on("click", function () {
        load_context_switcher();
    });

    $('#form_add_tasklog').submit(function () {
        event.preventDefault();
        event.stopImmediatePropagation();
        var data = $('form#form_add_tasklog').serializeObject();
        data['csrf_token'] = $('#csrf_token').val();

        post_request_api('/case/tasklog/add', JSON.stringify(data), true)
        .done(function (data){
            if(notify_auto_api(data)){
                $('#modal_add_tasklog').modal('hide');
            }
        });
        return false;
    });

    showdown.extension('bootstrap-tables', function () {
      return [{
        type: "output",
        filter: function (html) {
          // parse the html string
          var liveHtml = $('<div></div>').html(html);
          $('table', liveHtml).each(function(){
            var table = $(this);

            // table bootstrap classes
            table.addClass('table table-striped table-bordered table-hover table-sm')
            // make table responsive
            .wrap('<div class="table-responsive"></div>');
          });
          return liveHtml.html();
        }
          }];
    });

    userWhoamiRequest();
});


