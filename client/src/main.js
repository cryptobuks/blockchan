"use strict";

var BC_REFRESH_UI    = true;
var BC_FILE_LIST     = [];
var BC_FILE_POS      = 0;
var BC_FILE_UPDATE   = true;
var BC_FILE_HASHER   = null;
var BC_FILE_READING  = false;
var BC_FILE_ITEMS    = [];
var BC_FILE_CHECKING = false;
var BC_LAST_ADDR     = null;
var BC_REFRESH_TX_N  = true;
var BC_HOT_INPUT     = false;
var BC_ADDRESS       = null;
var BC_TXS           = null;

function bc_start() {
    if (window.attachEvent) {
        window.attachEvent('onload', bc_main);
    } else {
        if (window.onload) {
            var curronload = window.onload;
            var newonload = function() {
                curronload();
                bc_main();
            };
            window.onload = newonload;
        } else {
            window.onload = bc_main;
        }
    }
}

function bc_main() {
    var greet = document.getElementById("bc-greet");
    greet.classList.add("disappear");

    setTimeout(function() {
        var greet = document.getElementById("bc-greet");
        greet.classList.add("bc-hidden-view");

        var main = document.getElementById("bc-main");
        main.classList.remove("bc-hidden-view");

        // Let's remove the greeting text.
        while (main.hasChildNodes()) main.removeChild(main.lastChild);

        var wrapper_table = document.createElement("div");
        wrapper_table.style.width="100%";
        wrapper_table.style.height="100%";
        wrapper_table.style.display="table";
        var wrapper_cell = document.createElement("div");
        wrapper_cell.style.display="table-cell";
        wrapper_cell.style.verticalAlign="middle";
        var wrapper = document.createElement("div");
        wrapper.style.marginLeft="auto";
        wrapper.style.marginRight="auto";

        // Let's construct the channel index input.
        var container = document.createElement("div");
        var table = document.createElement("table");
        var caption = document.createElement("caption");
        var tr1 = document.createElement("tr");
        var tr2 = document.createElement("tr");
        var tr3 = document.createElement("tr");
        var tr4 = document.createElement("tr");
        var td1 = document.createElement("td");
        var td2 = document.createElement("td");
        var td3 = document.createElement("td");
        var td4 = document.createElement("td");
        var symbols = document.createElement("div");
        var cancel  = document.createElement("div");
        var sym_file_txt = document.createElement("span");
        var sym_file = document.createElement("a");
        var sym_find_txt = document.createElement("span");
        var sym_find = document.createElement("a");
        var sym_stop_txt = document.createElement("span");
        var sym_stop = document.createElement("a");
        table.id = "bc-searchtable";

        var input = document.createElement("input");
        input.size = "1";
        input.id = "bc-input";
        input.placeholder = "Enter the channel keyword or its Bitcoin address here.";
        input.classList.add("bc-borderbox");
        if (input.addEventListener) {
            input.addEventListener('input', function() {
                bc_input_update();
            }, false);
        }

        var output = document.createElement("input");
        output.size = "1";
        output.id = "bc-output";
        output.placeholder = "Channel's Bitcoin address will appear here.";
        output.classList.add("bc-borderbox");
        output.readOnly = true;

        container.id = "bc-table-container";
        container.classList.add("bc-container");
        symbols.id = "bc-symbols"
        symbols.classList.add("bc-container");
        cancel.id = "bc-cancel"
        cancel.classList.add("bc-container");
        sym_file_txt.appendChild(document.createTextNode("⎙"));
        sym_find_txt.appendChild(document.createTextNode("⌕"));
        sym_stop_txt.appendChild(document.createTextNode("⊗"));
        sym_file_txt.classList.add("bc-symbol");
        sym_find_txt.classList.add("bc-symbol");
        sym_stop_txt.classList.add("bc-symbol");

        sym_file.appendChild(sym_file_txt);
        sym_find.appendChild(sym_find_txt);
        sym_stop.appendChild(sym_stop_txt);
        sym_file.title = "Use a file as the channel address.";
        sym_file.href = "#";
        sym_file.id = "bc-link-file";
        sym_find.title = "Go to channel.";
        sym_find.href = "#";
        sym_find.id = "bc-link-find";
        sym_stop.title = "Cancel file hashing.";
        sym_stop.href = "#";
        sym_stop.id = "bc-link-stop";

        sym_find.onclick = function() {
            bc_refresh_main_links();
            return true;
        }

        sym_file.onclick = function() {
            bc_attach_file();
            return false;
        }

        sym_stop.onclick = function() {
            bc_handle_file_cancel();
            return false;
        }

        var invis = document.createElement("div");
        invis.style.display = "none";
        invis.id = "bc-browse-cell";

        var txs = document.createElement("span");
        txs.id = "bc-txs-span";
        txs.appendChild(document.createTextNode("(empty channel)"));

        caption.appendChild(document.createTextNode("Channel Selection"));
        td1.appendChild(input);
        tr1.appendChild(td1);
        td2.appendChild(output);
        tr2.appendChild(td2);
        invis.appendChild(bc_create_browse_btn());
        td3.appendChild(invis);
        tr3.appendChild(td3);
        td4.appendChild(txs);
        tr4.appendChild(td4);
        table.appendChild(caption);
        table.appendChild(tr1);
        table.appendChild(tr2);
        table.appendChild(tr3);
        table.appendChild(tr4);
        container.appendChild(table);

        wrapper.appendChild(container);
        symbols.appendChild(sym_file);
        symbols.appendChild(sym_find);
        wrapper.appendChild(symbols);
        cancel.appendChild(sym_stop);
        wrapper.appendChild(cancel);
        wrapper_cell.appendChild(wrapper);
        wrapper_table.appendChild(wrapper_cell);

        main.appendChild(wrapper_table);
        main.classList.add("appear");

        bc_refresh_ui();
        // Let's start the main loop.
        setTimeout(function() {
            bc_main_loop();
        }, 1000);
    }, 500);
}

function bc_main_loop() {
    BC_FILE_UPDATE = true;

    bc_check_hash();

    if (BC_REFRESH_UI) bc_refresh_ui();
    if (BC_REFRESH_TX_N && !BC_HOT_INPUT) {
        bc_refresh_tx_n();
        bc_refresh_main_links();
    }

    bc_chan_step();

    BC_HOT_INPUT = false;
    setTimeout(function(){
        bc_main_loop();
    }, 1000);
}

function bc_refresh_main_links() {
    var output = document.getElementById("bc-output");

    var find = document.getElementById("bc-link-find");
    if (Bitcoin.testAddress(output.value)) {
        find.href = "#"+output.value;
        find.title = "Go to channel #"+output.value+".";
    }
    else {
        find.href = "#";
        find.title = "Do nothing.";
    }
}

function bc_refresh_ui() {
    BC_REFRESH_UI = false;
    var input = document.getElementById("bc-input");
    if (BC_FILE_LIST.length == 0) {
        input.disabled = false;
    }
    else input.disabled = true;

    var symbols = document.getElementById("bc-symbols");
    var cancel  = document.getElementById("bc-cancel");
    if (BC_FILE_LIST.length > 0) {
        symbols.style.display = "none";
        cancel.style.display = "inline-block";
    }
    else {
        symbols.style.display = "inline-block";
        cancel.style.display = "none";
    }
}

function bc_input_update() {
    var input = document.getElementById("bc-input");
    var value = input.value;

    if (!Bitcoin.testAddress(value)) {
        var ripemd160 = CryptoJS.algo.RIPEMD160.create();
        ripemd160.update(value);
        var hash = ripemd160.finalize();
        value = Bitcoin.createAddressFromText(hex2ascii(hash));
    }

    var output = document.getElementById("bc-output");
    if (output.value !== value) {
        BC_REFRESH_TX_N = true;
        BC_HOT_INPUT = true;
    }
    output.value = value;
}

function bc_attach_file() {
    bc_perform_click("bc-browse-btn");
}

function bc_handle_file_select(evt) {
    var files = evt.target.files;
    bc_file_selection(files);
}

function bc_file_selection(files) {
    if (BC_FILE_READING) return;

    BC_FILE_LIST = [];
    for (var i = 0, f; f = files[i]; i++) {
        BC_FILE_LIST.push(f);
    }
    bc_refresh_ui();
    bc_read_files();
    BC_REFRESH_TX_N = true;
    BC_LAST_ADDR = null;

    var browse_cell = document.getElementById("bc-browse-cell");
    while (browse_cell.hasChildNodes()) browse_cell.removeChild(browse_cell.lastChild);
    browse_cell.appendChild(bc_create_browse_btn());
}

function bc_file_try_to_cancel() {
    if (BC_FILE_READING) {
        setTimeout(function(){
            bc_file_try_to_cancel();
        }, 1000);
        return;
    }

    BC_FILE_LIST   = [];
    BC_FILE_POS    = 0;
    BC_FILE_HASHER = null;
    BC_FILE_ITEMS  = [];

    BC_REFRESH_UI = true;
    BC_REFRESH_TX_N = true;
    var input = document.getElementById("bc-input");
    var output = document.getElementById("bc-output");
    input.value = "";
    output.value = "";
}

function bc_handle_file_cancel() {
    BC_FILE_LIST = [];
    bc_file_try_to_cancel();
}

function bc_create_browse_btn() {
    var browse_btn = document.createElement("input");
    browse_btn.type = "file";
    browse_btn.id   = "bc-browse-btn";
    browse_btn.name = "files[]";
    browse_btn.multiple = false;
    browse_btn.addEventListener('change',  bc_handle_file_select, false);
    return browse_btn;
}

function bc_perform_click(elemId) {
    var elem = document.getElementById(elemId);
    if(elem && document.createEvent) {
        var evt = document.createEvent("MouseEvents");
        evt.initEvent("click", true, false);
        elem.dispatchEvent(evt);
    }
}

function bc_read_files() {
    if (BC_FILE_LIST.length === 0) return;

    if (BC_FILE_CHECKING) {
        setTimeout(function(){
            bc_read_files();
        }, 1000);
        return;
    }

    var status  = null;
    var refresh = false;
    var done    = (BC_FILE_POS === BC_FILE_LIST[0].size);
    if (BC_FILE_UPDATE || done) {
        status  = document.getElementById("bc-output");
        refresh = true;
        BC_FILE_UPDATE = false;
    }

    if (done) {
        if (refresh) {
            if (BC_FILE_HASHER !== null) {
                var hash = BC_FILE_HASHER.finalize().toString(CryptoJS.enc.Hex);
                var addr = Bitcoin.createAddressFromText(hex2ascii(hash));
                status.value = addr;
                var item = {
                    fname     : BC_FILE_LIST[0].name,
                    ripemd160 : hash,
                    btc_addr  : addr
                };

                var find = document.getElementById("bc-link-find");
                find.href = "#"+addr;
                find.title = "Go to channel #"+addr+".";

                BC_FILE_ITEMS.push(item);
                BC_REFRESH_TX_N = true;
            }
            else status.value = "---";
        }
        BC_FILE_LIST.shift();
        BC_FILE_POS = 0;
        BC_FILE_HASHER = null;

        if (BC_FILE_LIST.length > 0) {
            setTimeout(function(){
                bc_read_files();
            }, 1000);
        }
        else BC_REFRESH_UI = true;
        return;
    }

    if (refresh) {
        var percentage = ((100*BC_FILE_POS)/BC_FILE_LIST[0].size).toFixed(1);
        status.value = percentage+"%";
    }

    if (BC_FILE_POS === 0 && BC_FILE_HASHER === null) {
        var input = document.getElementById("bc-input");
        input.value = BC_FILE_LIST[0].name+" ("+formatBytes(BC_FILE_LIST[0].size)+")";
    }

    var buf_size  = 64*1024;
    var last_byte = Math.min(BC_FILE_POS+buf_size, BC_FILE_LIST[0].size-1);
    bc_read_blob(BC_FILE_LIST[0], BC_FILE_POS, last_byte);
}

function bc_refresh_tx_n() {
    if (BC_FILE_CHECKING) return;
    BC_REFRESH_TX_N = false;

    var output = document.getElementById("bc-output");
    var addr = output.value;

    if (!Bitcoin.testAddress(addr)) {
        bc_refresh_txs("");
        return;
    }

    if (addr === BC_LAST_ADDR) return;

    BC_FILE_CHECKING = true;
    xmlhttpGet("https://blockchain.info/multiaddr?active="+addr+"&cors=true&format=json", '',
        function(response) {
            BC_FILE_CHECKING = false;

            var output = document.getElementById("bc-output");
            if (addr !== output.value) return;

                 if (response === false) bc_refresh_txs("");
            else if (response === null ) bc_refresh_txs("");
            else {
                BC_LAST_ADDR = addr;
                var json = JSON.parse(response);
                if ("addresses" in json && json.addresses.length > 0
                && json.addresses[0].n_tx > 0) {
                    bc_refresh_txs(addr, json.addresses[0].n_tx);
                    BC_TXS = json.txs;
                }
                else bc_refresh_txs("");
            }
        }
    );
}

function bc_read_blob(file, opt_startByte, opt_stopByte) {
    var start = opt_startByte;
    var stop  = opt_stopByte;

    var reader = new FileReader();

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
            BC_FILE_READING = false;
            if (BC_FILE_HASHER === null) {
                BC_FILE_HASHER = CryptoJS.algo.RIPEMD160.create();
            }
            var wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(evt.target.result));
            BC_FILE_HASHER.update(wordArray);

            BC_FILE_POS = stop+1;
            bc_read_files();
        }
    };

    var blob = file.slice(start, stop + 1);
    BC_FILE_READING = true;
    reader.readAsArrayBuffer(blob);
}

function bc_refresh_txs(addr, n_tx) {
    if (addr === "") {
        var txs = document.getElementById("bc-txs-span");
        if (!txs.classList.contains("appear")) return;

        txs.classList.remove("appear");
        txs.classList.add("disappear");

        setTimeout(function() {
            var txs = document.getElementById("bc-txs-span");
            while (txs.hasChildNodes()) txs.removeChild(txs.lastChild);
            txs.appendChild(document.createTextNode("(empty channel)"));
        }, 1000);

        return;
    }

    var txs = document.getElementById("bc-txs-span");
    while (txs.hasChildNodes()) txs.removeChild(txs.lastChild);

    var text = "Found "+n_tx+" transaction"+(n_tx == 1 ? "" : "s")+".";

    var a_proof   = document.createElement("a");
    a_proof.appendChild(document.createTextNode(text));
    a_proof.title = "Browse this channel's transactions.";
    a_proof.href  = "https://blockchain.info/address/"+addr;
    a_proof.target= "_blank";
    a_proof.classList.add("bc-txs-link");

    txs.appendChild(document.createTextNode("("));
    txs.appendChild(a_proof);
    txs.appendChild(document.createTextNode(")"));
    txs.classList.remove("disappear");
    txs.classList.add("appear");
}

var bc_check_hash = (function() {
    var running = false;

    return function() {
        if (running) return;
        running = true;

        var address = null;
        var hashes = location.hash.substring(1).split("#");
        for (var i=0, sz=hashes.length; i<sz; ++i) {
            var hash = decodeURIComponent(hashes[i]);
                 if (Bitcoin.testAddress(hash)) address = hash;
            else if (hash.length > 0) {
                var ripemd160 = CryptoJS.algo.RIPEMD160.create();
                ripemd160.update(hash);
                address = Bitcoin.createAddressFromText(hex2ascii(ripemd160.finalize()));
            }
        }

        if (address !== null) {
            var input = document.getElementById("bc-input");
            var ripemd160 = CryptoJS.algo.RIPEMD160.create();
            ripemd160.update(input.value);
            var input_hash = Bitcoin.createAddressFromText(hex2ascii(ripemd160.finalize()));

            if (input.value !== address && input_hash !== address) {
                input.value = address;
                bc_input_update();
                running = false;
                return;
            }

            var output = document.getElementById("bc-output");
            if ((output.value !== input.value && output.value !== input_hash)
            || BC_FILE_CHECKING) {
                running = false;
                return;
            }
        }

        if (address !== BC_ADDRESS) {
            BC_ADDRESS = address;

            var x = document.getElementsByClassName("bc-view");
            for (var i = 0; i < x.length; i++) {
                x[i].classList.remove("appear");
                x[i].classList.add("disappear");
            }

            setTimeout(function() {
                var x = document.getElementsByClassName("bc-view");
                for (var i = 0; i < x.length; i++) {
                    x[i].classList.add("bc-hidden-view");
                }

                if (BC_ADDRESS === null) {
                    var view = document.getElementById("bc-main");
                    view.classList.remove("disappear");
                    view.classList.add("appear");
                    view.classList.remove("bc-hidden-view");
                }
                else {
                    var view = document.getElementById("bc-chan");
                    view.classList.remove("disappear");
                    view.classList.add("appear");
                    view.classList.remove("bc-hidden-view");
                }

                running = false;
            }, 500);

            return;
        }

        running = false;
    };
})();

