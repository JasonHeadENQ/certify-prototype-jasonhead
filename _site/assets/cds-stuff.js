




if (typeof jQuery=="undefined") { console.warn("CDS requires jQuery.")};
/**
 * Date picker
 * Date picker script is a fallback for any browser that
 * does not offer native support for the HTML5 date input.
 * If a browser does not recognize an input, it defaults
 * back to a text input. This script will provide a fallback
 * that auto formats the text box as the user enters the date
 * to a MM/DD/YYYY format.
 *
 * Also includes a way to format number fields with a class
 * name of js-format-as-date
 *
 * Usage:
 * Works on any <input type="date"> in non-supporting browsers
 *
 * To format dates on a number input, use
 * <input type="number" class="js-format-as-date">
 *
 */


$(document).ready(function() {
  function checkDateInput() {
      var input = document.createElement('input');
      input.setAttribute('type','date');

      var notADateValue = 'not-a-date';
      input.setAttribute('value', notADateValue);

      return (input.value !== notADateValue);
  }

  function formatDates(element) {
    var date = element;
    function checkValue(str, max) {
      if (str.charAt(0) !== '0' || str == '00') {
        var num = parseInt(str);
        if (isNaN(num) || num <= 0 || num > max) num = 1;
        str = num > parseInt(max.toString().charAt(0)) && num.toString().length == 1 ? '0' + num : num.toString();
      };
      return str;
    };

    date.on('keyup', function(e) {
      this.type = 'text';
      var input = this.value;
      if (/\D\/$/.test(input)) input = input.substr(0, input.length - 3);
      var values = input.split('/').map(function(v) {
        return v.replace(/\D/g, '')
      });
      if (values[0]) values[0] = checkValue(values[0], 12);
      if (values[1]) values[1] = checkValue(values[1], 31);
      var output = values.map(function(v, i) {
        return v.length == 2 && i < 2 ? v + ' / ' : v;
      });
      this.value = output.join('').substr(0, 14);
    });

    date.on('blur', function(e) {
      this.type = 'text';
      var input = this.value;
      var values = input.split('/').map(function(v, i) {
        return v.replace(/\D/g, '')
      });
      var output = '';

      if (values.length == 3) {
        var year = values[2].length !== 4 ? parseInt(values[2]) + 2000 : parseInt(values[2]);
        var month = parseInt(values[0]) - 1;
        var day = parseInt(values[1]);
        var d = new Date(year, month, day);
        if (!isNaN(d)) {
          var dates = [d.getMonth() + 1, d.getDate(), d.getFullYear()];
          output = dates.map(function(v) {
            v = v.toString();
            return v.length == 1 ? '0' + v : v;
          }).join(' / ');
        };
      };
      this.value = output;
    });

  }

  // Automatically format dates on date inputs on
  // browsers that do not support them
  if (!checkDateInput()) {
    formatDates($('input[type="date"]'));
  }

  // Format date for text inputs
  formatDates($('.js-format-as-date'));

});
$(document).ready(function() {
  var $editable_table = $('.sba-c-table--editable'),
      $add_button = $editable_table.next('[id$="_add_item"]');
      var previous_values = [];
      var itemID;

      var getItemID = function(e){
        if (typeof e.attr('id') != "undefined") {
          itemID = "#" + e.attr('id').replace('_edit','').replace('_delete','').replace('_save','').replace('_cancel','');
        }
      }

      var closeTaskPanels = function(){
        // Clase the task panels
        $('.sba-c-task-panel__toggle').attr("aria-expanded", "false");
        $('.sba-c-task-panel__content').removeClass('visible');
        $('.sba-c-task-panel__toggle').attr("disabled", "");
      }


      var numberWithCommas = function(number) {
          var parts = number.toString().split(".");
          parts[0] = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
          return parts.join(".");
      }

      var calculateTableSummaries = function(table) {
        var table_cols = table.find('thead tr th').length;

        for (var i = 0; i < table_cols; i++) {
          var $table_header = table.find('thead tr th:nth-child(' + (i+1) + ').js-sum');

          // See if there are any sum classes
          if ($table_header.length) {
            var sum = 0;
            // Get total values
            table.find('tbody tr[id$="_data"] td:nth-child(' + (i+1) + ')').each(function(){
              formatted_number = $(this).text().replace("$", "").replace(/,/g, "");
              sum += parseInt(formatted_number);
            });

            if (isNaN(sum)) {
              sum = 0;
            }

            if ($table_header.attr("data-info-type") == "usd") {
              sum = "$" + numberWithCommas(sum);
            }
            else if ($table_header.attr("data-info-type") == "percent") {
              sum = sum + "%";
            }

            table.find('tfoot tr td:nth-child(' + (i+1) + ')')
              .text(sum)
              .attr("data-table-header", $table_header.text());
          }
        }
      }

      $editable_table.on('click', '[id$="_edit"]', function(e){
        e.stopPropagation();
        getItemID($(e.target));

        // Close the task panels
        closeTaskPanels();

        // Hide data row
        $(itemID + "_data").attr("hidden", "");

        // Show fields
        $(itemID + "_fields").removeAttr("hidden").find('input:first').focus();

        // Store data from fieldset
        previous_values = [];
        $(itemID + "_fields").find('input').each(function(){
          input_id = "#" + $(this).attr('id');
          initial_val = $(this).val();
          previous_values.push([input_id, initial_val]);
        });

        // Disable adding rows while editing a rows
        $add_button.attr("disabled", "");

        // Update data in fields
        return false;
      });

      // Remove table row
      $editable_table.on('click', '[id$="_delete"]', function(e){
        e.stopPropagation();
        var table = "#" + $(this).closest('table').attr('id');

        getItemID($(e.target));
        var confirmed = confirm('Are you sure you want to delete this item?');
        if (confirmed) {
          $(itemID + "_data").remove();
        }
        calculateTableSummaries($(table));

        if ($(table).find('tbody tr').length <= 2) {
          $(table).find('tbody tr[id$="0_data"]').removeAttr("hidden");
          $(table).find('tfoot').remove();
        }
        return false;
      });

      // Save button
      $editable_table.on('click', '[id$="_save"]', function(e){
        e.stopPropagation();
        getItemID($(e.target));

        //// See if any columns need to be summarized, then create one if not created already
        var table = "#" + $(this).closest('table').attr('id');

         // Run Validations on the table
         validateFields($(table));

        // If there are no validation errors
         if (!has_validation_errors) {
           // Make aria less annoying
           $(table).attr('aria-live', 'polite');

           new_values = [];
           $(itemID + "_fields").find('input').each(function(){
             input_id = "#" + $(this).attr('id');

             if ($(this).hasClass('js-usd')) {
               initial_val = "$" + $(this).val();
             }
             else if ($(this).hasClass('js-percent')) {
               initial_val = $(this).val() + "%";
             }
             else {
               initial_val = $(this).val();
             }
             new_values.push([input_id, initial_val]);
           });


           var summated_cols = $(table).find('.js-sum').length;
           if ((summated_cols > 0) && ($(table).find('tfoot').length == 0)) {
             $(table).find('thead').after('<tfoot></tfoot>');
             var table_cols = $(table).find('thead tr th').length;

             for (var i = 0; i < table_cols; i++) {
               if (i == 0) {
                 $(table).find('tfoot').append('<tr><th scope="row">Totals</th></tr>');
               }
               else {
                 $(table).find('tfoot tr').append('<td></td>');
               }
             }
           }

           // Update the values
           for (var i = 0; i < new_values.length; i++)
           {
             $(new_values[i][0] + "_text").text(new_values[i][1]);


           }

           calculateTableSummaries($(table));

           getItemID($(e.target));

           // Show the data row
           $(itemID + "_data").removeAttr("hidden");

           // Hide fields
           $(itemID + "_fields").attr("hidden", "");

           // Re-enabled the the add button
           $add_button.removeAttr("disabled", "");

           // Re-enable task panels
           $('.sba-c-task-panel__toggle').removeAttr("disabled");
         }
        return false;
      });


      // Cancel Button
      $editable_table.on('click', '[id$="_cancel"]', function(e){
        e.stopPropagation();
        var table = "#" + $(this).closest('table').attr('id');

        // Reset the values
        for (var i = 0; i < previous_values.length; i++)
        {
          $(previous_values[i][0]).val(previous_values[i][1]);
        }

        // Show the data row
        $(itemID + "_data").removeAttr("hidden");

        // Re-enable task panels
        $('.sba-c-task-panel__toggle').removeAttr("disabled");

        // Hide fields
        $(itemID + "_fields").attr("hidden", "");

        // If canceling an ADD fields
        if ($(itemID + "_data").find('> *:first-child').text().length < 1) {
          $(e.target).closest('tr').prev('tr').remove();
          $(e.target).closest('tr').remove();
        }

        // Re-enabled the the add button
        $add_button.removeAttr("disabled");

        // Restore the null state
        if ($(table).find('tbody tr').length <= 2) {
          $(table).find('tbody tr[id$="0_data"]').removeAttr("hidden");
        }

        return false;
      });

      // Add a table row
      $add_button.on('click', function(){

        // Get itemID for the cancel button
        getItemID($(this));

        // Close the task panels
        closeTaskPanels();

        // Only allow adding one row at time.
        $(this).attr("disabled", "");

        // Get some variables
        var table = "#" + $(this).attr('id').replace('_add_item',''),
            table_name = $(this).attr('id').replace('_add_item','');
            row_id_arr = [];

        // Get highest ID
        $(table).find('tbody tr').each(function(){
          var ids = $(this).attr('id')
            .replace(table_name ,'')
            .replace('_fields','')
            .replace('_data','')
            .replace('_tr','');
          row_id_arr.push(ids);
        });

        // Just in case a null state has not been added
        if (row_id_arr.length === 0) {
          row_id_arr = [];
          row_id_arr.push(0);
        }

        // Hide the null row
        $(table).find('tbody tr[id$="0_data"]').attr("hidden", "");

        // Make aria less annoying
        $(table).attr('aria-live', 'off');

        // Get next ID number and number of rows needed
        var next_id = Math.max.apply(Math,row_id_arr) + 1,
            table_cols = $(table).find('thead tr th').length,
            row_name = table_name + '_tr' + next_id,
            data_row_id = row_name + '_data',
            fields_row_id = row_name + '_fields';

        // Create empty table rows
        $(table).find('tbody')
          .append('<tr class="is-added" id="' + data_row_id + '" hidden></tr>')
          .append('<tr id="' + fields_row_id + '"></tr>');

        // Create the table cells
        // Note - change the liquid tags
        for (var i = 0; i < table_cols; i++) {

          var $table_header_th = $(table).find('thead tr th:nth-child(' + (i + 1) + ')');

          // Get custom id attribute
          if (typeof $table_header_th.attr('data-custom-id') != 'undefined') {
            var custom_id_value = $table_header_th.attr('data-custom-id'),
                custom_id = '_' + custom_id_value;
            custom_id = custom_id.replace(/\s/g, "_");
          }
          else {
            var custom_id = '';
          }

          var data_header_text = $(table).find('thead tr th:nth-child(' + (i + 1) + ')').text();
          var data_row_th = '<th scope="row" id="' + row_name + '_field' + (i + 1) + custom_id + '_text" data-table-header="' + data_header_text + '"></th>';
          var data_row_td = '<td id="' + row_name + '_field' + (i + 1) + custom_id + '_text" data-table-header="' +  data_header_text + '" ></td>'
          var data_row_actions ='\
            <td data-table-header="' +  data_header_text + '" >\
              <div class="sba-c-task-panel">\
                <button type="button" class="sba-c-button sba-c-button--transparent sba-c-task-panel__toggle" aria-expanded="false" aria-controls="'+ fields_row_id +'_panel">\
                  <svg class="sba-c-icon" aria-hidden="true" viewBox="0 0 512 512">\
                    <title >Horizontal Ellipsis</title>\
                    <path d="M328 256c0 39.8-32.2 72-72 72s-72-32.2-72-72 32.2-72 72-72 72 32.2 72 72zm104-72c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72zm-352 0c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72z"></path>\
                  </svg>\
                  <span class="sba-u-visibility--screen-reader">Toggle menu to edit this row</span>\
                </button>\
                <div id="'+ fields_row_id +'_panel" class="sba-c-task-panel__content">\
                  <ul class="sba-c-task-panel__menu">\
                    <li class="sba-c-task-panel__menu__item">\
                      <a href="#" class="sba-c-task-panel__menu__link" id="'+ row_name +'_edit" aria-controls="'+ fields_row_id +'">Edit this item</a>\
                    </li>\
                    <li class="sba-c-task-panel__menu__item">\
                      <a href="#" class="sba-c-task-panel__menu__link--emergency" id="'+ row_name +'_delete">Delete</a>\
                    </li>\
                  </ul>\
                </div>\
              </div>\
            </td>';

          // Append the table cells
          if (i == 0) {
            $("#" + data_row_id).append(data_row_th); // first
          }
          else if (i == (table_cols - 1)) {
            $("#" + data_row_id).append(data_row_actions); // last
          }
          else {
            $("#" + data_row_id).append(data_row_td); // everything in between
          }
        }

        // Add the form field container
        var form_field_wrapper = '\
          <td colspan="' + table_cols + '">\
            <ul class="sba-c-field-list"></ul>\
            <div class="sba-c-table--editable__actions">\
              <button id="'+ row_name +'_save" class="sba-c-button" aria-controls="'+ data_row_id +' ' + fields_row_id+ '">OK</button>\
              <a id="' + row_name + '_cancel"  href="#" aria-controls="'+ data_row_id +' ' + fields_row_id+ '">Cancel</a>\
            </div>\
          </td>';

        // Add the wrapper
        $("#" + fields_row_id).append(form_field_wrapper);

        // Iterate through adding the form inputs
        for (var i = 0; i < table_cols - 1; i++) {
          var $table_header_th = $(table).find('thead tr th:nth-child(' + (i + 1) + ')');

          // Get custom id attribute
          if (typeof $table_header_th.attr('data-custom-id') != 'undefined') {
            var custom_id_value = $table_header_th.attr('data-custom-id'),
                custom_id = '_' + custom_id_value;
            custom_id = custom_id.replace(/\s/g, "_");
          }
          else {
            var custom_id = '';
          }

          // Get optional input attributes from data-[ATTRIBUTE]
          var optional_attribute_value = {};
          var optional_attributes = [];
          var optional_attribute_types = ['min', 'max', 'minlength', 'maxlength', 'pattern', 'required'];

          for (var c = 0; c < optional_attribute_types.length; c++) {

            if (typeof $table_header_th.attr('data-'+ optional_attribute_types[c] +'') != 'undefined') {
              optional_attribute_value[optional_attribute_types[c]] = $table_header_th.attr('data-'  + optional_attribute_types[c]);
              optional_attributes.push(optional_attribute_types[c] + '="' + optional_attribute_value[optional_attribute_types[c]] + '"' );
            }
          };

          optional_attributes = optional_attributes.join(" ").toString();


          // Get some more variables
          var input_type = $table_header_th.attr("data-info-type"),
              label_text = $table_header_th.text(),
              field_id = table_name + '_tr' + next_id + '_field' + (i + 1) + custom_id;

          // Get the hint hint text
          if (typeof $table_header_th.attr('data-hint-text') != 'undefined') {
            var aria_describedby_attribute = 'aria-describedby=' + field_id + '_hint';
            var hint_text = '<p class="sba-c-form-hint" id="' + field_id + '_hint">'+ $table_header_th.attr('data-hint-text') +'</p>';
          }
          else {
            var hint_text = '';
            var aria_describedby_attribute = '';
          }

          // Set input type to text if there is a min value or max value
          if ((optional_attributes.indexOf('min=') > -1) || (optional_attributes.indexOf('max=') > -1)) {
            var input_type_attribute = 'number';
          }
          else {
            var input_type_attribute = 'text';
          }



          // IMPORTANT: Before creating the gem, we are going to need
          // to fix the file path of the SVG.
          switch (input_type) {
            case "usd":
              var form_input = '\
              <div class="sba-c-input-ornament-container">\
                <div class="sba-c-input-ornament sba-c-input-ornament--left">\
                  <svg aria-hidden="true" class="sba-c-icon" viewBox="0 0 320 512">\
                    <title>Dollar Sign</title>\
                    <path d="M113.411 169.375c0-23.337 21.536-38.417 54.865-38.417 26.726 0 54.116 12.263 76.461 28.333 5.88 4.229 14.13 2.354 17.575-4.017l23.552-43.549c2.649-4.898 1.596-10.991-2.575-14.68-24.281-21.477-59.135-34.09-91.289-37.806V12c0-6.627-5.373-12-12-12h-40c-6.627 0-12 5.373-12 12v49.832c-58.627 13.29-97.299 55.917-97.299 108.639 0 123.533 184.765 110.81 184.765 169.414 0 19.823-16.311 41.158-52.124 41.158-30.751 0-62.932-15.88-87.848-35.887-5.31-4.264-13.082-3.315-17.159 2.14l-30.389 40.667c-3.627 4.854-3.075 11.657 1.302 15.847 24.049 23.02 59.249 41.255 98.751 47.973V500c0 6.627 5.373 12 12 12h40c6.627 0 12-5.373 12-12v-47.438c65.72-10.215 106.176-59.186 106.176-116.516.001-119.688-184.764-103.707-184.764-166.671z"></path>\
                  </svg>\
                </div>\
                <input type="number" id="'+ field_id +'" class="sba-u-input-width--10 js-usd" '+ aria_describedby_attribute + ' ' + optional_attributes +'>\
              </div>';
              break;
            case "percent":
              var form_input = '\
              <div class="sba-c-input-ornament-container">\
                <div class="sba-c-input-ornament sba-c-input-ornament--right">\
                  <svg aria-hidden="true" class="sba-c-icon" viewBox="0 0 448 512">\
                    <title>Percent</title>\
                    <path d="M112 224c61.9 0 112-50.1 112-112S173.9 0 112 0 0 50.1 0 112s50.1 112 112 112zm0-160c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zm224 224c-61.9 0-112 50.1-112 112s50.1 112 112 112 112-50.1 112-112-50.1-112-112-112zm0 160c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zM392.3.2l31.6-.1c19.4-.1 30.9 21.8 19.7 37.8L77.4 501.6a23.95 23.95 0 0 1-19.6 10.2l-33.4.1c-19.5 0-30.9-21.9-19.7-37.8l368-463.7C377.2 4 384.5.2 392.3.2z"></path>\
                  </svg>\
                </div>\
                <input type="number" id="'+ field_id +'" class="sba-u-input-width--3 js-percent" ' + aria_describedby_attribute + ' ' + optional_attributes +'>\
              </div>';
              break;
            default:
              var form_input = '<input id="' + field_id + '" type="' + input_type_attribute + '" '+ aria_describedby_attribute + ' ' + optional_attributes + '>';
          }



          var form_field = '\
            <li>\
              <label for="' + field_id + '" class="sba-c-label">' + label_text + '</label>\
              '+ hint_text +'\
              '+ form_input + '\
            </li>';

          $("#" + fields_row_id + " td ul").append(form_field);
        }

        // Focus on the first field
        $("#" + fields_row_id).find('input:first').focus();



        return false;
      });

      $editable_table.on('click', 'tr.is-added .sba-c-task-panel__toggle', function(e){
        toggler = $(e.target);
        window.toggle_task_panels(toggler);
      });
});
/*

  Show and hide followup fields for radio buttons and checkboxes
  Todo: we need to DRY up the code a little bit.
*/


$(document).ready(function() {
  var aria_hidden_attr = "aria-hidden",
      $radio = $("input:radio"),
      $checkbox = $('input:checkbox[data-follow-up]'),
      $selectbox = $('select');

  var showFollowup = function(control, target) {
    target.removeAttr("hidden");
    control.attr("aria-expanded", "true");
    target.find('input, select, textarea').removeAttr("disabled");
  }

  var hideFollowup = function(control, target) {
    target.attr("hidden", "");
    control.attr("aria-expanded", "false");
    target.find('input, select, textarea').attr("disabled", "true");
  };

  // Handle Radio Buttons
  $radio.change(function () {
    var name = $(this).attr("name");
    var $control = $('input:radio[name="'+ name +'"]');

    $control.each(function(){
      var target = $(this).attr('data-follow-up');
      if ($(this).is(":checked")) {
        showFollowup($control, $('#' + target));
      }
      else {
        hideFollowup($control, $('#' + target));
      }
    });
  });

  // Handle Checkboxes
  $checkbox.change(function(){
    var $control = $(this),
        target = $(this).attr('data-follow-up');
    if ($(this).is(":checked")) {
      showFollowup($control, $('#' + target));
    }
    else {
      hideFollowup($control, $('#' + target));
    }
  });

  // Handle Select Boxes
  var previous;
  $selectbox.on('click focus keydown', function(){
    previous = $(this).find(':selected').attr('data-follow-up');
  }).change(function(){
    var $control = $(this).find('option[data-follow-up]:selected'),
        selected_val = $(this).find('option[data-follow-up]:selected').val(),
        target = $(this).find(':selected').attr('data-follow-up');
    if ($(this).find(':selected').val() == selected_val) {
      showFollowup($control, $('#' + target));
    }
    if (selected_val != previous) {
      hideFollowup($control, $('#' + previous));
    }
  });

});
$(document).ready(function(){
  // Variables
  var $task_panel_toggle = $('.sba-c-task-panel__toggle');


  // Function for handling task panels
  $task_panel_toggle.on('click', function(){
    window.toggle_task_panels($(this));
  });

  window.toggle_task_panels = function(panel){
    // Determine which task panel we clicked on
    var $target = $("#" + panel.attr("aria-controls")),
        $task_panel_content = $('.sba-c-task-panel__content'),
        open_class = "open",
        transition_class = "in-transition",
        visible_class = "visible";

    // First Let's Close any open task panels
    $('.sba-c-task-panel__toggle').not(panel)
      .attr("aria-expanded","false")
      .parent()
        .removeClass(open_class)
          .find($task_panel_content)
            .removeClass(transition_class);

    $task_panel_toggle.not(panel)
      .one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',
      function(e) {
        $task_panel_toggle.not(panel)
          .find($task_panel_content)
            .removeClass(visible_class);
      });

    // Next, we determine if the panel is open or closed based on aria-expanded
    if (panel.attr("aria-expanded") === "false") {
      panel.attr("aria-expanded", "true");
      $target.parent()
        .addClass(open_class);
      $target.addClass(visible_class);
      setTimeout(function(){
        $target.addClass(transition_class)
      }, 20);
    }
    else {
      panel.attr("aria-expanded", "false");
      $target.removeClass(transition_class);
      $target.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',
      function(e) {
        $target.removeClass(visible_class);
        $target.parent().removeClass(open_class);
      });
    }

    // DEV Note: Please refactor this to DRY it up and incorporate into the add note feature
    $('#add_note').on('click', function(){
      $task_panel_toggle.attr("aria-expanded", "false");
      $target.removeClass(transition_class);
      $target.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',
      function(e) {
        $target.removeClass(visible_class);
        $target.parent().removeClass(open_class);
      });
    });
  };


});
$(document).ready(function() {
  var $trigger = $('.sba-js-visibility-trigger');

  $trigger.on('click', function(){
    var target = "#" + $(this).attr('aria-controls');
    if ($(this).attr("aria-expanded") === "false" ) {
      $(this).attr("aria-expanded", "true").css('transform', 'rotate(180deg)');
      $(target).removeAttr("hidden");
    }
    else {
      $(this).attr("aria-expanded", "false").removeAttr("style");
      $(target).attr("hidden", "");
    }
    return false;
  });
});
/**
 * Check Validations
 * validateFields will valid form fields. Best to place on clicking a
 * submit button, but can be used in other functions as well. The validateFields
 * function exists in the global scope, so it can be called on generated
 * form fields.
 *
 * Usage:
 * validateFields([FORM_ID]);
 * if (!has_validation_errors) {
 *  // Stuff that happens when validation passes
 * }
 *
 */


$(document).ready(function() {
  // checkValidity() will crash IE9, so we need to bypass it there.
  var hasBrowserValidation = (typeof document.createElement('input').checkValidity == 'function');

  var errorClass = "sba-c-input--error",
      labelErrorClass = "sba-c-label--error",
      errorID = "error",
      $errorplaceholder = $('.error-placeholder'),
      errorContainer = ('<div class="sba-c-error-wrapper"></div>');


    window.validateFields = function(e){
      // If the browser validation is supported, we'll run this function
      // Otherwise we hve to rely on server validation
      if (hasBrowserValidation) {
      // Redefine the inputs since some will be removed on page load
        $inputs = $(e).find('input:not([type="hidden"]), input:not([type="submit"]), select');
        // Validate each input
        $inputs.each(function() {
          var $el = $(this);
          if (!this.checkValidity()) {
            window.has_validation_errors = true;
            event.preventDefault();
            clearErrors($el);
            displayErrors($el);
            $el.focus();
            return false;
          }
          else {
            window.has_validation_errors = false;
            clearErrors($el);
          }
        });
      }
      else {
        window.has_validation_errors = false;
      }
    };


  var displayErrors = function($el) {
    var errorMessage = $el.attr('data-custom-validity') || $el[0].validationMessage,
      errorFieldName = $el.attr('id'),
      $label = $('label[for="'+errorFieldName+'"]'),
      $container = $el.closest('.sba-c-field-group');

    if (($el.attr("type") != "radio") && ($el.attr("type") != "checkbox")) {
      var errorMessage = '<span id="error" aria-atomic="true" class="sba-c-input-error-message" role="alert">'+errorMessage+'</span>';
      $el.closest('li').addClass('sba-c-error-wrapper');
      $el.addClass(errorClass);
      $label.addClass(labelErrorClass);
      $el.next().remove('.form-feedback');
      if ($el.parents().find($errorplaceholder).length) {
        $errorplaceholder.html(errorMessage);
      }
      else {
        $label.before(errorMessage);
      }
    }
    else if ($el.attr("type") == "checkbox") {
      $el.before('<span aria-atomic="true" class="sba-c-input-error-message" role="alert">'+errorMessage+'</span>');
    }
    else {
      $el.parent().parent().before('<span aria-atomic="true" class="sba-c-input-error-message" role="alert">'+errorMessage+'</span>');
    }
    $container.attr('id',  errorID).addClass(errorClass);
    location.href = "#" + errorID;
  };

  var clearErrors = function($el) {
    $el.removeClass(errorClass);
    $('.sba-c-input-error-message').remove();
    $('label.'+ labelErrorClass).removeClass(labelErrorClass);
    $('#error').removeClass(errorClass).removeAttr('id');
    $('.sba-c-error-wrapper').removeClass('sba-c-error-wrapper');
  };
});
!function(a,b){"function"==typeof define&&define.amd?define([],function(){return a.svg4everybody=b()}):"object"==typeof exports?module.exports=b():a.svg4everybody=b()}(this,function(){/*! svg4everybody v2.0.0 | github.com/jonathantneal/svg4everybody */
function a(a,b){if(b){var c=!a.getAttribute("viewBox")&&b.getAttribute("viewBox"),d=document.createDocumentFragment(),e=b.cloneNode(!0);for(c&&a.setAttribute("viewBox",c);e.childNodes.length;)d.appendChild(e.firstChild);a.appendChild(d)}}function b(b){b.onreadystatechange=function(){if(4===b.readyState){var c=document.createElement("x");c.innerHTML=b.responseText,b.s.splice(0).map(function(b){a(b[0],c.querySelector("#"+b[1].replace(/(\W)/g,"\\$1")))})}},b.onreadystatechange()}function c(c){function d(){for(var c;c=e[0];){var j=c.parentNode;if(j&&/svg/i.test(j.nodeName)){var k=c.getAttribute("xlink:href");if(f&&(!g||g(k,j,c))){var l=k.split("#"),m=l[0],n=l[1];if(j.removeChild(c),m.length){var o=i[m]=i[m]||new XMLHttpRequest;o.s||(o.s=[],o.open("GET",m),o.send()),o.s.push([j,n]),b(o)}else a(j,document.getElementById(n))}}}h(d,17)}c=c||{};var e=document.getElementsByTagName("use"),f="shim"in c?c.shim:/\bEdge\/12\b|\bTrident\/[567]\b|\bVersion\/7.0 Safari\b/.test(navigator.userAgent)||(navigator.userAgent.match(/AppleWebKit\/(\d+)/)||[])[1]<537,g=c.validate,h=window.requestAnimationFrame||setTimeout,i={};f&&d()}return c});
/*

Init file for kicking things off

*/


svg4everybody();

<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
  <symbol id="address-card" viewBox="0 0 512 512">
    <title id="address-card-title">Address Card</title>
    <path d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm-288 64c44.183 0 80 35.817 80 80s-35.817 80-80 80-80-35.817-80-80 35.817-80 80-80zm112 232c0 13.255-10.745 24-24 24H88c-13.255 0-24-10.745-24-24v-29.897a24 24 0 0 1 17.407-23.077l28.938-8.268C129.323 312.549 152.087 320 176 320s46.677-7.451 65.656-21.241l28.938 8.268A23.999 23.999 0 0 1 288 330.103V360zm160-52c0 6.627-5.373 12-12 12H332c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h104c6.627 0 12 5.373 12 12v8zm0-64c0 6.627-5.373 12-12 12H332c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h104c6.627 0 12 5.373 12 12v8zm0-64c0 6.627-5.373 12-12 12H332c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h104c6.627 0 12 5.373 12 12v8z"></path>
  </symbol>
  <symbol id="alarm-clock" viewBox="0 0 512 512">
    <title id="alarm-clock-title">Alarm Clock</title>
    <path d="M512 96c0 27.8-11.8 52.8-30.7 70.3C450.8 109.9 399 65.2 335 44.4 352.1 17.7 382 0 416 0c53 0 96 43 96 96zM177 44.4C159.9 17.7 130 0 96 0 43 0 0 43 0 96c0 27.8 11.8 52.8 30.7 70.3C61.2 109.9 113 65.2 177 44.4zm323.3 455.9c-15.7 15.7-41 15.6-56.6 0l-42.1-42.1c-39.2 33.5-90 53.8-145.6 53.8s-106.5-20.3-145.6-53.8l-42.1 42.1c-15.7 15.7-41 15.6-56.6 0-15.6-15.6-15.6-40.9 0-56.6l47.9-47.9C42 363.8 32 327.1 32 288 32 164.3 132.3 64 256 64s224 100.3 224 224c0 39.1-10 75.8-27.6 107.8l47.9 47.9c15.6 15.6 15.6 41 0 56.6zM346.9 324.1l-54.9-40V162.7c0-6.6-5.4-12-12-12h-48c-6.6 0-12 5.4-12 12v152c0 3.8 1.8 7.5 4.9 9.7l79.7 57.9c5.4 3.9 12.9 2.7 16.8-2.6l28.2-38.8c3.9-5.4 2.7-12.9-2.7-16.8z"></path>
  </symbol>
  <symbol id="angle-double-down" viewBox="0 0 320 512">
    <title id="angle-double-down-title">Angle Double Down</title>
    <path d="M143 256.3L7 120.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4 96.4-96.4c9.4-9.4 24.6-9.4 33.9 0L313 86.3c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.4 9.5-24.6 9.5-34 .1zm34 192l136-136c9.4-9.4 9.4-24.6 0-33.9l-22.6-22.6c-9.4-9.4-24.6-9.4-33.9 0L160 352.1l-96.4-96.4c-9.4-9.4-24.6-9.4-33.9 0L7 278.3c-9.4 9.4-9.4 24.6 0 33.9l136 136c9.4 9.5 24.6 9.5 34 .1z"></path>
  </symbol>
  <symbol id="angle-double-left" viewBox="0 0 448 512">
    <title id="angle-double-left-title">Angle Double Left</title>
    <path d="M223.7 239l136-136c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9L319.9 256l96.4 96.4c9.4 9.4 9.4 24.6 0 33.9L393.7 409c-9.4 9.4-24.6 9.4-33.9 0l-136-136c-9.5-9.4-9.5-24.6-.1-34zm-192 34l136 136c9.4 9.4 24.6 9.4 33.9 0l22.6-22.6c9.4-9.4 9.4-24.6 0-33.9L127.9 256l96.4-96.4c9.4-9.4 9.4-24.6 0-33.9L201.7 103c-9.4-9.4-24.6-9.4-33.9 0l-136 136c-9.5 9.4-9.5 24.6-.1 34z"></path>
  </symbol>
  <symbol id="angle-double-right" viewBox="0 0 448 512">
    <title id="angle-double-right-title">Angle Double Right</title>
    <path d="M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34zm192-34l-136-136c-9.4-9.4-24.6-9.4-33.9 0l-22.6 22.6c-9.4 9.4-9.4 24.6 0 33.9l96.4 96.4-96.4 96.4c-9.4 9.4-9.4 24.6 0 33.9l22.6 22.6c9.4 9.4 24.6 9.4 33.9 0l136-136c9.4-9.2 9.4-24.4 0-33.8z"></path>
  </symbol>
  <symbol id="angle-double-up" viewBox="0 0 320 512">
    <title id="angle-double-up-title">Angle Double Up</title>
    <path d="M177 255.7l136 136c9.4 9.4 9.4 24.6 0 33.9l-22.6 22.6c-9.4 9.4-24.6 9.4-33.9 0L160 351.9l-96.4 96.4c-9.4 9.4-24.6 9.4-33.9 0L7 425.7c-9.4-9.4-9.4-24.6 0-33.9l136-136c9.4-9.5 24.6-9.5 34-.1zm-34-192L7 199.7c-9.4 9.4-9.4 24.6 0 33.9l22.6 22.6c9.4 9.4 24.6 9.4 33.9 0l96.4-96.4 96.4 96.4c9.4 9.4 24.6 9.4 33.9 0l22.6-22.6c9.4-9.4 9.4-24.6 0-33.9l-136-136c-9.2-9.4-24.4-9.4-33.8 0z"></path>
  </symbol>
  <symbol id="angle-down" viewBox="0 0 320 512">
    <title id="angle-down-title">angle-down</title>
    <path d="M143 352.3L7 216.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4 96.4-96.4c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.2 9.4-24.4 9.4-33.8 0z"></path>
  </symbol>
  <symbol id="angle-left" viewBox="0 0 256 512">
    <title id="angle-left-title">angle-left</title>
    <path d="M31.7 239l136-136c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9L127.9 256l96.4 96.4c9.4 9.4 9.4 24.6 0 33.9L201.7 409c-9.4 9.4-24.6 9.4-33.9 0l-136-136c-9.5-9.4-9.5-24.6-.1-34z"></path>
  </symbol>
  <symbol id="angle-right" viewBox="0 0 256 512">
    <title id="angle-right-title">angle-right</title>
    <path d="M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34z"></path>
  </symbol>
  <symbol id="angle-up" viewBox="0 0 320 512">
    <title id="angle-up-title">angle-up</title>
    <path d="M177 159.7l136 136c9.4 9.4 9.4 24.6 0 33.9l-22.6 22.6c-9.4 9.4-24.6 9.4-33.9 0L160 255.9l-96.4 96.4c-9.4 9.4-24.6 9.4-33.9 0L7 329.7c-9.4-9.4-9.4-24.6 0-33.9l136-136c9.4-9.5 24.6-9.5 34-.1z"></path>
  </symbol>
  <symbol id="archive" viewBox="0 0 512 512">
    <title id="archive-title">Archive</title>
    <path d="M488 128H24c-13.255 0-24-10.745-24-24V56c0-13.255 10.745-24 24-24h464c13.255 0 24 10.745 24 24v48c0 13.255-10.745 24-24 24zm-8 328V184c0-13.255-10.745-24-24-24H56c-13.255 0-24 10.745-24 24v272c0 13.255 10.745 24 24 24h400c13.255 0 24-10.745 24-24zM308 256H204c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h104c6.627 0 12 5.373 12 12v8c0 6.627-5.373 12-12 12z"></path>
  </symbol>
  <symbol id="arrow-alt-circle-down" viewBox="0 0 512 512">
    <title id="arrow-alt-circle-down-title">Alternate Arrow Circle Down</title>
    <path d="M504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zM212 140v116h-70.9c-10.7 0-16.1 13-8.5 20.5l114.9 114.3c4.7 4.7 12.2 4.7 16.9 0l114.9-114.3c7.6-7.6 2.2-20.5-8.5-20.5H300V140c0-6.6-5.4-12-12-12h-64c-6.6 0-12 5.4-12 12z"></path>
  </symbol>
  <symbol id="arrow-alt-circle-left" viewBox="0 0 512 512">
    <title id="arrow-alt-circle-left-title">Alternate Arrow Circle Left</title>
    <path d="M256 504C119 504 8 393 8 256S119 8 256 8s248 111 248 248-111 248-248 248zm116-292H256v-70.9c0-10.7-13-16.1-20.5-8.5L121.2 247.5c-4.7 4.7-4.7 12.2 0 16.9l114.3 114.9c7.6 7.6 20.5 2.2 20.5-8.5V300h116c6.6 0 12-5.4 12-12v-64c0-6.6-5.4-12-12-12z"></path>
  </symbol>
  <symbol id="arrow-alt-circle-right" viewBox="0 0 512 512">
    <title id="arrow-alt-circle-right-title">Alternate Arrow Circle Right</title>
    <path d="M256 8c137 0 248 111 248 248S393 504 256 504 8 393 8 256 119 8 256 8zM140 300h116v70.9c0 10.7 13 16.1 20.5 8.5l114.3-114.9c4.7-4.7 4.7-12.2 0-16.9l-114.3-115c-7.6-7.6-20.5-2.2-20.5 8.5V212H140c-6.6 0-12 5.4-12 12v64c0 6.6 5.4 12 12 12z"></path>
  </symbol>
  <symbol id="arrow-alt-circle-up" viewBox="0 0 512 512">
    <title id="arrow-alt-circle-up-title">Alternate Arrow Circle Up</title>
    <path d="M8 256C8 119 119 8 256 8s248 111 248 248-111 248-248 248S8 393 8 256zm292 116V256h70.9c10.7 0 16.1-13 8.5-20.5L264.5 121.2c-4.7-4.7-12.2-4.7-16.9 0l-115 114.3c-7.6 7.6-2.2 20.5 8.5 20.5H212v116c0 6.6 5.4 12 12 12h64c6.6 0 12-5.4 12-12z"></path>
  </symbol>
  <symbol id="arrow-alt-down" viewBox="0 0 448 512">
    <title id="arrow-alt-down-title">Alternate Arrow Down</title>
    <path d="M176 32h96c13.3 0 24 10.7 24 24v200h103.8c21.4 0 32.1 25.8 17 41L241 473c-9.4 9.4-24.6 9.4-34 0L31.3 297c-15.1-15.1-4.4-41 17-41H152V56c0-13.3 10.7-24 24-24z"></path>
  </symbol>
  <symbol id="arrow-alt-from-bottom" viewBox="0 0 384 512">
    <title id="arrow-alt-from-bottom-title">Alternate Arrow from Bottom</title>
    <path d="M360 480H24c-13.3 0-24-10.7-24-24v-24c0-13.3 10.7-24 24-24h336c13.3 0 24 10.7 24 24v24c0 13.3-10.7 24-24 24zM256 360V224h87.7c17.8 0 26.7-21.5 14.1-34.1L205.7 37.7c-7.5-7.5-19.8-7.5-27.3 0L26.1 189.9C13.5 202.5 22.5 224 40.3 224H128v136c0 13.3 10.7 24 24 24h80c13.3 0 24-10.7 24-24z"></path>
  </symbol>
  <symbol id="arrow-alt-from-left" viewBox="0 0 448 512">
    <title id="arrow-alt-from-left-title">Alternate Arrow from Left</title>
    <path d="M0 424V88c0-13.3 10.7-24 24-24h24c13.3 0 24 10.7 24 24v336c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24zm120-104h136v87.7c0 17.8 21.5 26.7 34.1 14.1l152.2-152.2c7.5-7.5 7.5-19.8 0-27.3L290.1 90.1c-12.6-12.6-34.1-3.7-34.1 14.1V192H120c-13.3 0-24 10.7-24 24v80c0 13.3 10.7 24 24 24z"></path>
  </symbol>
  <symbol id="arrow-alt-from-right" viewBox="0 0 448 512">
    <title id="arrow-alt-from-right-title">Alternate Arrow from Right</title>
    <path d="M448 88v336c0 13.3-10.7 24-24 24h-24c-13.3 0-24-10.7-24-24V88c0-13.3 10.7-24 24-24h24c13.3 0 24 10.7 24 24zM328 192H192v-87.7c0-17.8-21.5-26.7-34.1-14.1L5.7 242.3c-7.5 7.5-7.5 19.8 0 27.3l152.2 152.2c12.6 12.6 34.1 3.7 34.1-14.1V320h136c13.3 0 24-10.7 24-24v-80c0-13.3-10.7-24-24-24z"></path>
  </symbol>
  <symbol id="arrow-alt-from-top" viewBox="0 0 384 512">
    <title id="arrow-alt-from-top-title">Alternate Arrow from Top</title>
    <path d="M24 32h336c13.3 0 24 10.7 24 24v24c0 13.3-10.7 24-24 24H24C10.7 104 0 93.3 0 80V56c0-13.3 10.7-24 24-24zm104 120v136H40.3c-17.8 0-26.7 21.5-14.1 34.1l152.2 152.2c7.5 7.5 19.8 7.5 27.3 0l152.2-152.2c12.6-12.6 3.7-34.1-14.1-34.1H256V152c0-13.3-10.7-24-24-24h-80c-13.3 0-24 10.7-24 24z"></path>
  </symbol>
  <symbol id="arrow-alt-left" viewBox="0 0 448 512">
    <title id="arrow-alt-left-title">Alternate Arrow Left</title>
    <path d="M448 208v96c0 13.3-10.7 24-24 24H224v103.8c0 21.4-25.8 32.1-41 17L7 273c-9.4-9.4-9.4-24.6 0-34L183 63.3c15.1-15.1 41-4.4 41 17V184h200c13.3 0 24 10.7 24 24z"></path>
  </symbol>
  <symbol id="arrow-alt-right" viewBox="0 0 448 512">
    <title id="arrow-alt-right-title">Alternate Arrow Right</title>
    <path d="M0 304v-96c0-13.3 10.7-24 24-24h200V80.2c0-21.4 25.8-32.1 41-17L441 239c9.4 9.4 9.4 24.6 0 34L265 448.7c-15.1 15.1-41 4.4-41-17V328H24c-13.3 0-24-10.7-24-24z"></path>
  </symbol>
  <symbol id="arrow-alt-square-down" viewBox="0 0 448 512">
    <title id="arrow-alt-square-down-title">Alternate Arrow Square Down</title>
    <path d="M448 80v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h352c26.5 0 48 21.5 48 48zm-268 60v116h-70.9c-10.7 0-16.1 13-8.5 20.5l114.9 114.3c4.7 4.7 12.2 4.7 16.9 0l114.9-114.3c7.6-7.6 2.2-20.5-8.5-20.5H268V140c0-6.6-5.4-12-12-12h-64c-6.6 0-12 5.4-12 12z"></path>
  </symbol>
  <symbol id="arrow-alt-square-left" viewBox="0 0 448 512">
    <title id="arrow-alt-square-left-title">Alternate Arrow Square Left</title>
    <path d="M400 480H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h352c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm-60-268H224v-70.9c0-10.7-13-16.1-20.5-8.5L89.2 247.5c-4.7 4.7-4.7 12.2 0 16.9l114.3 114.9c7.6 7.6 20.5 2.2 20.5-8.5V300h116c6.6 0 12-5.4 12-12v-64c0-6.6-5.4-12-12-12z"></path>
  </symbol>
  <symbol id="arrow-alt-square-right" viewBox="0 0 448 512">
    <title id="arrow-alt-square-right-title">Alternate Arrow Square Right</title>
    <path d="M48 32h352c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48zm60 268h116v70.9c0 10.7 13 16.1 20.5 8.5l114.3-114.9c4.7-4.7 4.7-12.2 0-16.9l-114.3-115c-7.6-7.6-20.5-2.2-20.5 8.5V212H108c-6.6 0-12 5.4-12 12v64c0 6.6 5.4 12 12 12z"></path>
  </symbol>
  <symbol id="arrow-alt-square-up" viewBox="0 0 448 512">
    <title id="arrow-alt-square-up-title">Alternate Arrow Square Up</title>
    <path d="M0 432V80c0-26.5 21.5-48 48-48h352c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48zm268-60V256h70.9c10.7 0 16.1-13 8.5-20.5L232.5 121.2c-4.7-4.7-12.2-4.7-16.9 0l-115 114.3C93 243 98.4 256 109.1 256H180v116c0 6.6 5.4 12 12 12h64c6.6 0 12-5.4 12-12z"></path>
  </symbol>
  <symbol id="arrow-alt-to-bottom" viewBox="0 0 384 512">
    <title id="arrow-alt-to-bottom-title">Alternate Arrow to Bottom</title>
    <path d="M360 480H24c-13.3 0-24-10.7-24-24v-24c0-13.3 10.7-24 24-24h336c13.3 0 24 10.7 24 24v24c0 13.3-10.7 24-24 24zM128 56v136H40.3c-17.8 0-26.7 21.5-14.1 34.1l152.2 152.2c7.5 7.5 19.8 7.5 27.3 0l152.2-152.2c12.6-12.6 3.7-34.1-14.1-34.1H256V56c0-13.3-10.7-24-24-24h-80c-13.3 0-24 10.7-24 24z"></path>
  </symbol>
  <symbol id="arrow-alt-to-left" viewBox="0 0 448 512">
    <title id="arrow-alt-to-left-title">Alternate Arrow to Left</title>
    <path d="M0 424V88c0-13.3 10.7-24 24-24h24c13.3 0 24 10.7 24 24v336c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24zm424-232H288v-87.7c0-17.8-21.5-26.7-34.1-14.1L101.7 242.3c-7.5 7.5-7.5 19.8 0 27.3l152.2 152.2c12.6 12.6 34.1 3.7 34.1-14.1V320h136c13.3 0 24-10.7 24-24v-80c0-13.3-10.7-24-24-24z"></path>
  </symbol>
  <symbol id="arrow-alt-to-right" viewBox="0 0 448 512">
    <title id="arrow-alt-to-right-title">Alternate Arrow to Right</title>
    <path d="M448 88v336c0 13.3-10.7 24-24 24h-24c-13.3 0-24-10.7-24-24V88c0-13.3 10.7-24 24-24h24c13.3 0 24 10.7 24 24zM24 320h136v87.7c0 17.8 21.5 26.7 34.1 14.1l152.2-152.2c7.5-7.5 7.5-19.8 0-27.3L194.1 90.1c-12.6-12.6-34.1-3.7-34.1 14.1V192H24c-13.3 0-24 10.7-24 24v80c0 13.3 10.7 24 24 24z"></path>
  </symbol>
  <symbol id="arrow-alt-to-top" viewBox="0 0 384 512">
    <title id="arrow-alt-to-top-title">Alternate Arrow to Top</title>
    <path d="M24 32h336c13.3 0 24 10.7 24 24v24c0 13.3-10.7 24-24 24H24C10.7 104 0 93.3 0 80V56c0-13.3 10.7-24 24-24zm232 424V320h87.7c17.8 0 26.7-21.5 14.1-34.1L205.7 133.7c-7.5-7.5-19.8-7.5-27.3 0L26.1 285.9C13.5 298.5 22.5 320 40.3 320H128v136c0 13.3 10.7 24 24 24h80c13.3 0 24-10.7 24-24z"></path>
  </symbol>
  <symbol id="arrow-alt-up" viewBox="0 0 448 512">
    <title id="arrow-alt-up-title">Alternate Arrow Up</title>
    <path d="M272 480h-96c-13.3 0-24-10.7-24-24V256H48.2c-21.4 0-32.1-25.8-17-41L207 39c9.4-9.4 24.6-9.4 34 0l175.8 176c15.1 15.1 4.4 41-17 41H296v200c0 13.3-10.7 24-24 24z"></path>
  </symbol>
  <symbol id="arrow-circle-down" viewBox="0 0 512 512">
    <title id="arrow-circle-down-title">Arrow Circle Down</title>
    <path d="M504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zm-143.6-28.9L288 302.6V120c0-13.3-10.7-24-24-24h-16c-13.3 0-24 10.7-24 24v182.6l-72.4-75.5c-9.3-9.7-24.8-9.9-34.3-.4l-10.9 11c-9.4 9.4-9.4 24.6 0 33.9L239 404.3c9.4 9.4 24.6 9.4 33.9 0l132.7-132.7c9.4-9.4 9.4-24.6 0-33.9l-10.9-11c-9.5-9.5-25-9.3-34.3.4z"></path>
  </symbol>
  <symbol id="arrow-circle-left" viewBox="0 0 512 512">
    <title id="arrow-circle-left-title">Arrow Circle Left</title>
    <path d="M256 504C119 504 8 393 8 256S119 8 256 8s248 111 248 248-111 248-248 248zm28.9-143.6L209.4 288H392c13.3 0 24-10.7 24-24v-16c0-13.3-10.7-24-24-24H209.4l75.5-72.4c9.7-9.3 9.9-24.8.4-34.3l-11-10.9c-9.4-9.4-24.6-9.4-33.9 0L107.7 239c-9.4 9.4-9.4 24.6 0 33.9l132.7 132.7c9.4 9.4 24.6 9.4 33.9 0l11-10.9c9.5-9.5 9.3-25-.4-34.3z"></path>
  </symbol>
  <symbol id="arrow-circle-right" viewBox="0 0 512 512">
    <title id="arrow-circle-right-title">Arrow Circle Right</title>
    <path d="M256 8c137 0 248 111 248 248S393 504 256 504 8 393 8 256 119 8 256 8zm-28.9 143.6l75.5 72.4H120c-13.3 0-24 10.7-24 24v16c0 13.3 10.7 24 24 24h182.6l-75.5 72.4c-9.7 9.3-9.9 24.8-.4 34.3l11 10.9c9.4 9.4 24.6 9.4 33.9 0L404.3 273c9.4-9.4 9.4-24.6 0-33.9L271.6 106.3c-9.4-9.4-24.6-9.4-33.9 0l-11 10.9c-9.5 9.6-9.3 25.1.4 34.4z"></path>
  </symbol>
  <symbol id="arrow-circle-up" viewBox="0 0 512 512">
    <title id="arrow-circle-up-title">Arrow Circle Up</title>
    <path d="M8 256C8 119 119 8 256 8s248 111 248 248-111 248-248 248S8 393 8 256zm143.6 28.9l72.4-75.5V392c0 13.3 10.7 24 24 24h16c13.3 0 24-10.7 24-24V209.4l72.4 75.5c9.3 9.7 24.8 9.9 34.3.4l10.9-11c9.4-9.4 9.4-24.6 0-33.9L273 107.7c-9.4-9.4-24.6-9.4-33.9 0L106.3 240.4c-9.4 9.4-9.4 24.6 0 33.9l10.9 11c9.6 9.5 25.1 9.3 34.4-.4z"></path>
  </symbol>
  <symbol id="arrow-down" viewBox="0 0 448 512">
    <title id="arrow-down-title">arrow-down</title>
    <path d="M413.1 222.5l22.2 22.2c9.4 9.4 9.4 24.6 0 33.9L241 473c-9.4 9.4-24.6 9.4-33.9 0L12.7 278.6c-9.4-9.4-9.4-24.6 0-33.9l22.2-22.2c9.5-9.5 25-9.3 34.3.4L184 343.4V56c0-13.3 10.7-24 24-24h32c13.3 0 24 10.7 24 24v287.4l114.8-120.5c9.3-9.8 24.8-10 34.3-.4z"></path>
  </symbol>
  <symbol id="arrow-from-bottom" viewBox="0 0 384 512">
    <title id="arrow-from-bottom-title">Arrow from Bottom</title>
    <path d="M360 480H24c-13.3 0-24-10.7-24-24v-24c0-13.3 10.7-24 24-24h336c13.3 0 24 10.7 24 24v24c0 13.3-10.7 24-24 24zM90.4 216.5l65.6-65.6V360c0 13.3 10.7 24 24 24h24c13.3 0 24-10.7 24-24V150.9l65.6 65.6c9.4 9.4 24.6 9.4 33.9 0l17-17c9.4-9.4 9.4-24.6 0-33.9L209 30.1c-9.4-9.4-24.6-9.4-33.9 0L39.5 165.6c-9.4 9.4-9.4 24.6 0 33.9l17 17c9.4 9.4 24.6 9.4 33.9 0z"></path>
  </symbol>
  <symbol id="arrow-from-left" viewBox="0 0 448 512">
    <title id="arrow-from-left-title">Arrow from Left</title>
    <path d="M0 424V88c0-13.3 10.7-24 24-24h24c13.3 0 24 10.7 24 24v336c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24zm254.5-269.6l65.6 65.6H120c-13.3 0-24 10.7-24 24v24c0 13.3 10.7 24 24 24h200.1l-65.6 65.6c-9.4 9.4-9.4 24.6 0 33.9l17 17c9.4 9.4 24.6 9.4 33.9 0L441 273c9.4-9.4 9.4-24.6 0-33.9L305.5 103.5c-9.4-9.4-24.6-9.4-33.9 0l-17 17c-9.4 9.4-9.4 24.6-.1 33.9z"></path>
  </symbol>
  <symbol id="arrow-from-right" viewBox="0 0 448 512">
    <title id="arrow-from-right-title">Arrow from Right</title>
    <path d="M448 88v336c0 13.3-10.7 24-24 24h-24c-13.3 0-24-10.7-24-24V88c0-13.3 10.7-24 24-24h24c13.3 0 24 10.7 24 24zM193.5 357.6L127.9 292H328c13.3 0 24-10.7 24-24v-24c0-13.3-10.7-24-24-24H127.9l65.6-65.6c9.4-9.4 9.4-24.6 0-33.9l-17-17c-9.4-9.4-24.6-9.4-33.9 0L7 239c-9.4 9.4-9.4 24.6 0 33.9l135.5 135.5c9.4 9.4 24.6 9.4 33.9 0l17-17c9.4-9.3 9.4-24.5.1-33.8z"></path>
  </symbol>
  <symbol id="arrow-from-top" viewBox="0 0 384 512">
    <title id="arrow-from-top-title">Arrow from Top</title>
    <path d="M24 32h336c13.3 0 24 10.7 24 24v24c0 13.3-10.7 24-24 24H24C10.7 104 0 93.3 0 80V56c0-13.3 10.7-24 24-24zm269.6 263.5L228 361.1V152c0-13.3-10.7-24-24-24h-24c-13.3 0-24 10.7-24 24v209.1l-65.6-65.6c-9.4-9.4-24.6-9.4-33.9 0l-17 17c-9.4 9.4-9.4 24.6 0 33.9L175 481.9c9.4 9.4 24.6 9.4 33.9 0l135.5-135.5c9.4-9.4 9.4-24.6 0-33.9l-17-17c-9.3-9.4-24.5-9.4-33.8 0z"></path>
  </symbol>
  <symbol id="arrow-left" viewBox="0 0 448 512">
    <title id="arrow-left-title">arrow-left</title>
    <path d="M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"></path>
  </symbol>
  <symbol id="arrow-right" viewBox="0 0 448 512">
    <title id="arrow-right-title">arrow-right</title>
    <path d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"></path>
  </symbol>
  <symbol id="arrow-square-down" viewBox="0 0 448 512">
    <title id="arrow-square-down-title">Arrow Square Down</title>
    <path d="M448 80v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h352c26.5 0 48 21.5 48 48zM328.4 227.1L256 302.6V120c0-13.3-10.7-24-24-24h-16c-13.3 0-24 10.7-24 24v182.6l-72.4-75.5c-9.3-9.7-24.8-9.9-34.3-.4l-10.9 11c-9.4 9.4-9.4 24.6 0 33.9L207 404.3c9.4 9.4 24.6 9.4 33.9 0l132.7-132.7c9.4-9.4 9.4-24.6 0-33.9l-10.9-11c-9.5-9.5-25-9.3-34.3.4z"></path>
  </symbol>
  <symbol id="arrow-square-left" viewBox="0 0 448 512">
    <title id="arrow-square-left-title">Arrow Square Left</title>
    <path d="M400 480H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h352c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zM252.9 360.4L177.4 288H360c13.3 0 24-10.7 24-24v-16c0-13.3-10.7-24-24-24H177.4l75.5-72.4c9.7-9.3 9.9-24.8.4-34.3l-11-10.9c-9.4-9.4-24.6-9.4-33.9 0L75.7 239c-9.4 9.4-9.4 24.6 0 33.9l132.7 132.7c9.4 9.4 24.6 9.4 33.9 0l11-10.9c9.5-9.5 9.3-25-.4-34.3z"></path>
  </symbol>
  <symbol id="arrow-square-right" viewBox="0 0 448 512">
    <title id="arrow-square-right-title">Arrow Square Right</title>
    <path d="M48 32h352c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48zm147.1 119.6l75.5 72.4H88c-13.3 0-24 10.7-24 24v16c0 13.3 10.7 24 24 24h182.6l-75.5 72.4c-9.7 9.3-9.9 24.8-.4 34.3l11 10.9c9.4 9.4 24.6 9.4 33.9 0L372.3 273c9.4-9.4 9.4-24.6 0-33.9L239.6 106.3c-9.4-9.4-24.6-9.4-33.9 0l-11 10.9c-9.5 9.6-9.3 25.1.4 34.4z"></path>
  </symbol>
  <symbol id="arrow-square-up" viewBox="0 0 448 512">
    <title id="arrow-square-up-title">Arrow Square Up</title>
    <path d="M0 432V80c0-26.5 21.5-48 48-48h352c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48zm119.6-147.1l72.4-75.5V392c0 13.3 10.7 24 24 24h16c13.3 0 24-10.7 24-24V209.4l72.4 75.5c9.3 9.7 24.8 9.9 34.3.4l10.9-11c9.4-9.4 9.4-24.6 0-33.9L241 107.7c-9.4-9.4-24.6-9.4-33.9 0L74.3 240.4c-9.4 9.4-9.4 24.6 0 33.9l10.9 11c9.6 9.5 25.1 9.3 34.4-.4z"></path>
  </symbol>
  <symbol id="arrow-to-bottom" viewBox="0 0 384 512">
    <title id="arrow-to-bottom-title">Arrow to Bottom</title>
    <path d="M360 480H24c-13.3 0-24-10.7-24-24v-24c0-13.3 10.7-24 24-24h336c13.3 0 24 10.7 24 24v24c0 13.3-10.7 24-24 24zm-66.4-280.5L228 265.1V56c0-13.3-10.7-24-24-24h-24c-13.3 0-24 10.7-24 24v209.1l-65.6-65.6c-9.4-9.4-24.6-9.4-33.9 0l-17 17c-9.4 9.4-9.4 24.6 0 33.9L175 385.9c9.4 9.4 24.6 9.4 33.9 0l135.5-135.5c9.4-9.4 9.4-24.6 0-33.9l-17-17c-9.3-9.4-24.5-9.4-33.8 0z"></path>
  </symbol>
  <symbol id="arrow-to-left" viewBox="0 0 448 512">
    <title id="arrow-to-left-title">Arrow to Left</title>
    <path d="M0 424V88c0-13.3 10.7-24 24-24h24c13.3 0 24 10.7 24 24v336c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24zm280.5-66.4L214.9 292H424c13.3 0 24-10.7 24-24v-24c0-13.3-10.7-24-24-24H214.9l65.6-65.6c9.4-9.4 9.4-24.6 0-33.9l-17-17c-9.4-9.4-24.6-9.4-33.9 0L94.1 239c-9.4 9.4-9.4 24.6 0 33.9l135.5 135.5c9.4 9.4 24.6 9.4 33.9 0l17-17c9.4-9.3 9.4-24.5 0-33.8z"></path>
  </symbol>
  <symbol id="arrow-to-right" viewBox="0 0 448 512">
    <title id="arrow-to-right-title">Arrow to Right</title>
    <path d="M448 88v336c0 13.3-10.7 24-24 24h-24c-13.3 0-24-10.7-24-24V88c0-13.3 10.7-24 24-24h24c13.3 0 24 10.7 24 24zm-280.5 66.4l65.6 65.6H24c-13.3 0-24 10.7-24 24v24c0 13.3 10.7 24 24 24h209.1l-65.6 65.6c-9.4 9.4-9.4 24.6 0 33.9l17 17c9.4 9.4 24.6 9.4 33.9 0L353.9 273c9.4-9.4 9.4-24.6 0-33.9L218.4 103.5c-9.4-9.4-24.6-9.4-33.9 0l-17 17c-9.4 9.4-9.4 24.6 0 33.9z"></path>
  </symbol>
  <symbol id="arrow-to-top" viewBox="0 0 384 512">
    <title id="arrow-to-top-title">Arrow to Top</title>
    <path d="M24 32h336c13.3 0 24 10.7 24 24v24c0 13.3-10.7 24-24 24H24C10.7 104 0 93.3 0 80V56c0-13.3 10.7-24 24-24zm66.4 280.5l65.6-65.6V456c0 13.3 10.7 24 24 24h24c13.3 0 24-10.7 24-24V246.9l65.6 65.6c9.4 9.4 24.6 9.4 33.9 0l17-17c9.4-9.4 9.4-24.6 0-33.9L209 126.1c-9.4-9.4-24.6-9.4-33.9 0L39.5 261.6c-9.4 9.4-9.4 24.6 0 33.9l17 17c9.4 9.4 24.6 9.4 33.9 0z"></path>
  </symbol>
  <symbol id="arrow-up" viewBox="0 0 448 512">
    <title id="arrow-up-title">arrow-up</title>
    <path d="M34.9 289.5l-22.2-22.2c-9.4-9.4-9.4-24.6 0-33.9L207 39c9.4-9.4 24.6-9.4 33.9 0l194.3 194.3c9.4 9.4 9.4 24.6 0 33.9L413 289.4c-9.5 9.5-25 9.3-34.3-.4L264 168.6V456c0 13.3-10.7 24-24 24h-32c-13.3 0-24-10.7-24-24V168.6L69.2 289.1c-9.3 9.8-24.8 10-34.3.4z"></path>
  </symbol>
  <symbol id="backward" viewBox="0 0 512 512">
    <title id="backward-title">backward</title>
    <path d="M11.5 280.6l192 160c20.6 17.2 52.5 2.8 52.5-24.6V96c0-27.4-31.9-41.8-52.5-24.6l-192 160c-15.3 12.8-15.3 36.4 0 49.2zm256 0l192 160c20.6 17.2 52.5 2.8 52.5-24.6V96c0-27.4-31.9-41.8-52.5-24.6l-192 160c-15.3 12.8-15.3 36.4 0 49.2z"></path>
  </symbol>
  <symbol id="ban" viewBox="0 0 512 512">
    <title id="ban-title">ban</title>
    <path d="M256 8C119.034 8 8 119.033 8 256s111.034 248 248 248 248-111.034 248-248S392.967 8 256 8zm130.108 117.892c65.448 65.448 70 165.481 20.677 235.637L150.47 105.216c70.204-49.356 170.226-44.735 235.638 20.676zM125.892 386.108c-65.448-65.448-70-165.481-20.677-235.637L361.53 406.784c-70.203 49.356-170.226 44.736-235.638-20.676z"></path>
  </symbol>
  <symbol id="bars" viewBox="0 0 448 512">
    <title id="bars-title">Bars</title>
    <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"></path>
  </symbol>
  <symbol id="bell" viewBox="0 0 448 512">
    <title id="bell-title">bell</title>
    <path d="M433.884 366.059C411.634 343.809 384 316.118 384 208c0-79.394-57.831-145.269-133.663-157.83A31.845 31.845 0 0 0 256 32c0-17.673-14.327-32-32-32s-32 14.327-32 32c0 6.75 2.095 13.008 5.663 18.17C121.831 62.731 64 128.606 64 208c0 108.118-27.643 135.809-49.893 158.059C-16.042 396.208 5.325 448 48.048 448H160c0 35.346 28.654 64 64 64s64-28.654 64-64h111.943c42.638 0 64.151-51.731 33.941-81.941zM224 472a8 8 0 0 1 0 16c-22.056 0-40-17.944-40-40h16c0 13.234 10.766 24 24 24z"></path>
  </symbol>
  <symbol id="bell-slash" viewBox="0 0 576 512">
    <title id="bell-slash-title">Bell Slash</title>
    <path d="M78.107 366.059C47.958 396.208 69.325 448 112.048 448H224c0 35.346 28.654 64 64 64 35.346 0 64-28.654 64-64h32.685L127.848 221.379c-2.198 97.078-28.439 123.378-49.741 144.68zM264 448c0 13.234 10.766 24 24 24a8 8 0 0 1 0 16c-22.056 0-40-17.944-40-40h16zm305.896 43.733l-10.762 12.086c-8.915 10.012-24.333 10.967-34.437 2.133L8.256 54.393C-1.848 45.558-2.811 30.28 6.104 20.267L16.865 8.181C25.781-1.831 41.199-2.786 51.303 6.049l113.81 99.512c24.017-28.778 57.946-48.996 96.55-55.39A31.85 31.85 0 0 1 256 32c0-17.673 14.327-32 32-32s32 14.327 32 32c0 6.75-2.095 13.008-5.663 18.17C390.169 62.731 448 128.606 448 208c0 108.118 27.634 135.809 49.884 158.059 12.149 12.149 15.923 27.776 13.33 42.121l56.53 49.427c10.104 8.835 11.067 24.113 2.152 34.126z"></path>
  </symbol>
  <symbol id="bolt" viewBox="0 0 320 512">
    <title id="bolt-title">Lightning Bolt</title>
    <path d="M295.973 160H180.572L215.19 30.184C219.25 14.956 207.756 0 192 0H56C43.971 0 33.8 8.905 32.211 20.828l-31.996 240C-1.704 275.217 9.504 288 24.004 288h118.701L96.646 482.466C93.05 497.649 104.659 512 119.992 512c8.35 0 16.376-4.374 20.778-11.978l175.973-303.997c9.244-15.967-2.288-36.025-20.77-36.025z"></path>
  </symbol>
  <symbol id="bullhorn" viewBox="0 0 576 512">
    <title id="bullhorn-title">bullhorn</title>
    <path d="M576 224c0-20.896-13.36-38.666-32-45.258V64c0-35.346-28.654-64-64-64-64.985 56-142.031 128-272 128H48c-26.51 0-48 21.49-48 48v96c0 26.51 21.49 48 48 48h43.263c-18.742 64.65 2.479 116.379 18.814 167.44 1.702 5.32 5.203 9.893 9.922 12.88 20.78 13.155 68.355 15.657 93.773 5.151 16.046-6.633 19.96-27.423 7.522-39.537-18.508-18.026-30.136-36.91-19.795-60.858a12.278 12.278 0 0 0-1.045-11.673c-16.309-24.679-3.581-62.107 28.517-72.752C346.403 327.887 418.591 395.081 480 448c35.346 0 64-28.654 64-64V269.258c18.64-6.592 32-24.362 32-45.258zm-96 139.855c-54.609-44.979-125.033-92.94-224-104.982v-69.747c98.967-12.042 169.391-60.002 224-104.982v279.711z"></path>
  </symbol>
  <symbol id="calculator" viewBox="0 0 448 512">
    <title id="calculator-title">Calculator</title>
    <path d="M0 464V48C0 21.49 21.49 0 48 0h352c26.51 0 48 21.49 48 48v416c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48zm384-284V76c0-6.627-5.373-12-12-12H76c-6.627 0-12 5.373-12 12v104c0 6.627 5.373 12 12 12h296c6.627 0 12-5.373 12-12zM128 308v-40c0-6.627-5.373-12-12-12H76c-6.627 0-12 5.373-12 12v40c0 6.627 5.373 12 12 12h40c6.627 0 12-5.373 12-12zm256 128V268c0-6.627-5.373-12-12-12h-40c-6.627 0-12 5.373-12 12v168c0 6.627 5.373 12 12 12h40c6.627 0 12-5.373 12-12zm-256 0v-40c0-6.627-5.373-12-12-12H76c-6.627 0-12 5.373-12 12v40c0 6.627 5.373 12 12 12h40c6.627 0 12-5.373 12-12zm128-128v-40c0-6.627-5.373-12-12-12h-40c-6.627 0-12 5.373-12 12v40c0 6.627 5.373 12 12 12h40c6.627 0 12-5.373 12-12zm0 128v-40c0-6.627-5.373-12-12-12h-40c-6.627 0-12 5.373-12 12v40c0 6.627 5.373 12 12 12h40c6.627 0 12-5.373 12-12z"></path>
  </symbol>
  <symbol id="calendar" viewBox="0 0 448 512">
    <title id="calendar-title">Calendar</title>
    <path d="M12 192h424c6.6 0 12 5.4 12 12v260c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V204c0-6.6 5.4-12 12-12zm436-44v-36c0-26.5-21.5-48-48-48h-48V12c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v52H160V12c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v52H48C21.5 64 0 85.5 0 112v36c0 6.6 5.4 12 12 12h424c6.6 0 12-5.4 12-12z"></path>
  </symbol>
  <symbol id="calendar-alt" viewBox="0 0 448 512">
    <title id="calendar-alt-title">Alternate Calendar</title>
    <path d="M436 160H12c-6.6 0-12-5.4-12-12v-36c0-26.5 21.5-48 48-48h48V12c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v52h128V12c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v52h48c26.5 0 48 21.5 48 48v36c0 6.6-5.4 12-12 12zM12 192h424c6.6 0 12 5.4 12 12v260c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V204c0-6.6 5.4-12 12-12zm116 204c0-6.6-5.4-12-12-12H76c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12v-40zm0-128c0-6.6-5.4-12-12-12H76c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12v-40zm128 128c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12v-40zm0-128c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12v-40zm128 128c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12v-40zm0-128c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12v-40z"></path>
  </symbol>
  <symbol id="caret-circle-down" viewBox="0 0 512 512">
    <title id="caret-circle-down-title">Caret Circle Down</title>
    <path d="M504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zm-379.5-27.5l123 123c4.7 4.7 12.3 4.7 17 0l123-123c7.6-7.6 2.2-20.5-8.5-20.5H133c-10.7 0-16.1 12.9-8.5 20.5z"></path>
  </symbol>
  <symbol id="caret-circle-left" viewBox="0 0 512 512">
    <title id="caret-circle-left-title">Caret Circle Left</title>
    <path d="M256 504C119 504 8 393 8 256S119 8 256 8s248 111 248 248-111 248-248 248zm27.5-379.5l-123 123c-4.7 4.7-4.7 12.3 0 17l123 123c7.6 7.6 20.5 2.2 20.5-8.5V133c0-10.7-12.9-16.1-20.5-8.5z"></path>
  </symbol>
  <symbol id="caret-circle-right" viewBox="0 0 512 512">
    <title id="caret-circle-right-title">Caret Circle Right</title>
    <path d="M256 8c137 0 248 111 248 248S393 504 256 504 8 393 8 256 119 8 256 8zm-27.5 379.5l123-123c4.7-4.7 4.7-12.3 0-17l-123-123c-7.6-7.6-20.5-2.2-20.5 8.5v246c0 10.7 12.9 16.1 20.5 8.5z"></path>
  </symbol>
  <symbol id="caret-circle-up" viewBox="0 0 512 512">
    <title id="caret-circle-up-title">Caret Circle Up</title>
    <path d="M8 256C8 119 119 8 256 8s248 111 248 248-111 248-248 248S8 393 8 256zm379.5 27.5l-123-123c-4.7-4.7-12.3-4.7-17 0l-123 123c-7.6 7.6-2.2 20.5 8.5 20.5h246c10.7 0 16.1-12.9 8.5-20.5z"></path>
  </symbol>
  <symbol id="caret-down" viewBox="0 0 320 512">
    <title id="caret-down-title">Caret Down</title>
    <path d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"></path>
  </symbol>
  <symbol id="caret-left" viewBox="0 0 192 512">
    <title id="caret-left-title">Caret Left</title>
    <path d="M192 127.338v257.324c0 17.818-21.543 26.741-34.142 14.142L29.196 270.142c-7.81-7.81-7.81-20.474 0-28.284l128.662-128.662c12.599-12.6 34.142-3.676 34.142 14.142z"></path>
  </symbol>
  <symbol id="caret-right" viewBox="0 0 192 512">
    <title id="caret-right-title">Caret Right</title>
    <path d="M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 398.804C21.543 411.404 0 402.48 0 384.662z"></path>
  </symbol>
  <symbol id="caret-square-down" viewBox="0 0 448 512">
    <title id="caret-square-down-title">Caret Square Down</title>
    <path d="M448 80v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h352c26.5 0 48 21.5 48 48zM92.5 220.5l123 123c4.7 4.7 12.3 4.7 17 0l123-123c7.6-7.6 2.2-20.5-8.5-20.5H101c-10.7 0-16.1 12.9-8.5 20.5z"></path>
  </symbol>
  <symbol id="caret-square-left" viewBox="0 0 448 512">
    <title id="caret-square-left-title">Caret Square Left</title>
    <path d="M400 480H48c-26.51 0-48-21.49-48-48V80c0-26.51 21.49-48 48-48h352c26.51 0 48 21.49 48 48v352c0 26.51-21.49 48-48 48zM259.515 124.485l-123.03 123.03c-4.686 4.686-4.686 12.284 0 16.971l123.029 123.029c7.56 7.56 20.485 2.206 20.485-8.485V132.971c.001-10.691-12.925-16.045-20.484-8.486z"></path>
  </symbol>
  <symbol id="caret-square-right" viewBox="0 0 448 512">
    <title id="caret-square-right-title">Caret Square Right</title>
    <path d="M48 32h352c26.51 0 48 21.49 48 48v352c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V80c0-26.51 21.49-48 48-48zm140.485 355.515l123.029-123.029c4.686-4.686 4.686-12.284 0-16.971l-123.029-123.03c-7.56-7.56-20.485-2.206-20.485 8.485v246.059c0 10.691 12.926 16.045 20.485 8.486z"></path>
  </symbol>
  <symbol id="caret-square-up" viewBox="0 0 448 512">
    <title id="caret-square-up-title">Caret Square Up</title>
    <path d="M0 432V80c0-26.51 21.49-48 48-48h352c26.51 0 48 21.49 48 48v352c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48zm355.515-140.485l-123.03-123.03c-4.686-4.686-12.284-4.686-16.971 0L92.485 291.515c-7.56 7.56-2.206 20.485 8.485 20.485h246.059c10.691 0 16.045-12.926 8.486-20.485z"></path>
  </symbol>
  <symbol id="caret-up" viewBox="0 0 320 512">
    <title id="caret-up-title">Caret Up</title>
    <path d="M288.662 352H31.338c-17.818 0-26.741-21.543-14.142-34.142l128.662-128.662c7.81-7.81 20.474-7.81 28.284 0l128.662 128.662c12.6 12.599 3.676 34.142-14.142 34.142z"></path>
  </symbol>
  <symbol id="check" viewBox="0 0 512 512">
    <title id="check-title">Check</title>
    <path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
  </symbol>
  <symbol id="check-circle" viewBox="0 0 512 512">
    <title id="check-circle-title">Check Circle</title>
    <path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path>
  </symbol>
  <symbol id="check-square" viewBox="0 0 448 512">
    <title id="check-square-title">Check Square</title>
    <path d="M400 480H48c-26.51 0-48-21.49-48-48V80c0-26.51 21.49-48 48-48h352c26.51 0 48 21.49 48 48v352c0 26.51-21.49 48-48 48zm-204.686-98.059l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.248-16.379-6.249-22.628 0L184 302.745l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.25 16.379 6.25 22.628.001z"></path>
  </symbol>
  <symbol id="chevron-circle-down" viewBox="0 0 512 512">
    <title id="chevron-circle-down-title">Chevron Circle Down</title>
    <path d="M504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zM273 369.9l135.5-135.5c9.4-9.4 9.4-24.6 0-33.9l-17-17c-9.4-9.4-24.6-9.4-33.9 0L256 285.1 154.4 183.5c-9.4-9.4-24.6-9.4-33.9 0l-17 17c-9.4 9.4-9.4 24.6 0 33.9L239 369.9c9.4 9.4 24.6 9.4 34 0z"></path>
  </symbol>
  <symbol id="chevron-circle-left" viewBox="0 0 512 512">
    <title id="chevron-circle-left-title">Chevron Circle Left</title>
    <path d="M256 504C119 504 8 393 8 256S119 8 256 8s248 111 248 248-111 248-248 248zM142.1 273l135.5 135.5c9.4 9.4 24.6 9.4 33.9 0l17-17c9.4-9.4 9.4-24.6 0-33.9L226.9 256l101.6-101.6c9.4-9.4 9.4-24.6 0-33.9l-17-17c-9.4-9.4-24.6-9.4-33.9 0L142.1 239c-9.4 9.4-9.4 24.6 0 34z"></path>
  </symbol>
  <symbol id="chevron-circle-right" viewBox="0 0 512 512">
    <title id="chevron-circle-right-title">Chevron Circle Right</title>
    <path d="M256 8c137 0 248 111 248 248S393 504 256 504 8 393 8 256 119 8 256 8zm113.9 231L234.4 103.5c-9.4-9.4-24.6-9.4-33.9 0l-17 17c-9.4 9.4-9.4 24.6 0 33.9L285.1 256 183.5 357.6c-9.4 9.4-9.4 24.6 0 33.9l17 17c9.4 9.4 24.6 9.4 33.9 0L369.9 273c9.4-9.4 9.4-24.6 0-34z"></path>
  </symbol>
  <symbol id="chevron-circle-up" viewBox="0 0 512 512">
    <title id="chevron-circle-up-title">Chevron Circle Up</title>
    <path d="M8 256C8 119 119 8 256 8s248 111 248 248-111 248-248 248S8 393 8 256zm231-113.9L103.5 277.6c-9.4 9.4-9.4 24.6 0 33.9l17 17c9.4 9.4 24.6 9.4 33.9 0L256 226.9l101.6 101.6c9.4 9.4 24.6 9.4 33.9 0l17-17c9.4-9.4 9.4-24.6 0-33.9L273 142.1c-9.4-9.4-24.6-9.4-34 0z"></path>
  </symbol>
  <symbol id="chevron-double-down" viewBox="0 0 448 512">
    <title id="chevron-double-down-title">Chevron Double Down</title>
    <path d="M207 477.5L12.7 283.1c-9.4-9.4-9.4-24.6 0-33.9l22.7-22.7c9.4-9.4 24.5-9.4 33.9 0l154.7 154 154.7-154c9.4-9.3 24.5-9.3 33.9 0l22.7 22.7c9.4 9.4 9.4 24.6 0 33.9L241 477.5c-9.4 9.3-24.6 9.3-34 0zm34-192L435.3 91.1c9.4-9.4 9.4-24.6 0-33.9l-22.7-22.7c-9.4-9.4-24.5-9.4-33.9 0L224 188.5 69.3 34.5c-9.4-9.3-24.5-9.3-33.9 0L12.7 57.2c-9.4 9.4-9.4 24.6 0 33.9L207 285.5c9.4 9.3 24.6 9.3 34 0z"></path>
  </symbol>
  <symbol id="chevron-double-left" viewBox="0 0 512 512">
    <title id="chevron-double-left-title">Chevron Double Left</title>
    <path d="M34.5 239L228.9 44.7c9.4-9.4 24.6-9.4 33.9 0l22.7 22.7c9.4 9.4 9.4 24.5 0 33.9L131.5 256l154 154.7c9.3 9.4 9.3 24.5 0 33.9l-22.7 22.7c-9.4 9.4-24.6 9.4-33.9 0L34.5 273c-9.3-9.4-9.3-24.6 0-34zm192 34l194.3 194.3c9.4 9.4 24.6 9.4 33.9 0l22.7-22.7c9.4-9.4 9.4-24.5 0-33.9L323.5 256l154-154.7c9.3-9.4 9.3-24.5 0-33.9l-22.7-22.7c-9.4-9.4-24.6-9.4-33.9 0L226.5 239c-9.3 9.4-9.3 24.6 0 34z"></path>
  </symbol>
  <symbol id="chevron-double-right" viewBox="0 0 512 512">
    <title id="chevron-double-right-title">Chevron Double Right</title>
    <path d="M477.5 273L283.1 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.7-22.7c-9.4-9.4-9.4-24.5 0-33.9l154-154.7-154-154.7c-9.3-9.4-9.3-24.5 0-33.9l22.7-22.7c9.4-9.4 24.6-9.4 33.9 0L477.5 239c9.3 9.4 9.3 24.6 0 34zm-192-34L91.1 44.7c-9.4-9.4-24.6-9.4-33.9 0L34.5 67.4c-9.4 9.4-9.4 24.5 0 33.9l154 154.7-154 154.7c-9.3 9.4-9.3 24.5 0 33.9l22.7 22.7c9.4 9.4 24.6 9.4 33.9 0L285.5 273c9.3-9.4 9.3-24.6 0-34z"></path>
  </symbol>
  <symbol id="chevron-double-up" viewBox="0 0 448 512">
    <title id="chevron-double-up-title">Chevron Double Up</title>
    <path d="M241 34.5l194.3 194.3c9.4 9.4 9.4 24.6 0 33.9l-22.7 22.7c-9.4 9.4-24.5 9.4-33.9 0L224 131.5l-154.7 154c-9.4 9.3-24.5 9.3-33.9 0l-22.7-22.7c-9.4-9.4-9.4-24.6 0-33.9L207 34.5c9.4-9.3 24.6-9.3 34 0zm-34 192L12.7 420.9c-9.4 9.4-9.4 24.6 0 33.9l22.7 22.7c9.4 9.4 24.5 9.4 33.9 0l154.7-154 154.7 154c9.4 9.3 24.5 9.3 33.9 0l22.7-22.7c9.4-9.4 9.4-24.6 0-33.9L241 226.5c-9.4-9.3-24.6-9.3-34 0z"></path>
  </symbol>
  <symbol id="chevron-down" viewBox="0 0 448 512">
    <title id="chevron-down-title">chevron-down</title>
    <path d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"></path>
  </symbol>
  <symbol id="chevron-left" viewBox="0 0 320 512">
    <title id="chevron-left-title">chevron-left</title>
    <path d="M34.52 239.03L228.87 44.69c9.37-9.37 24.57-9.37 33.94 0l22.67 22.67c9.36 9.36 9.37 24.52.04 33.9L131.49 256l154.02 154.75c9.34 9.38 9.32 24.54-.04 33.9l-22.67 22.67c-9.37 9.37-24.57 9.37-33.94 0L34.52 272.97c-9.37-9.37-9.37-24.57 0-33.94z"></path>
  </symbol>
  <symbol id="chevron-right" viewBox="0 0 320 512">
    <title id="chevron-right-title">chevron-right</title>
    <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"></path>
  </symbol>
  <symbol id="chevron-square-down" viewBox="0 0 448 512">
    <title id="chevron-square-down-title">Chevron Square Down</title>
    <path d="M448 80v352c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V80c0-26.51 21.49-48 48-48h352c26.51 0 48 21.49 48 48zM240.971 361.941l135.515-135.515c9.373-9.373 9.373-24.569 0-33.941l-16.971-16.971c-9.373-9.373-24.569-9.373-33.941 0L224 277.088 122.427 175.515c-9.373-9.373-24.569-9.373-33.941 0l-16.971 16.971c-9.373 9.373-9.373 24.569 0 33.941L207.03 361.942c9.372 9.372 24.568 9.372 33.941-.001z"></path>
  </symbol>
  <symbol id="chevron-square-left" viewBox="0 0 448 512">
    <title id="chevron-square-left-title">Chevron Square Left</title>
    <path d="M400 480H48c-26.51 0-48-21.49-48-48V80c0-26.51 21.49-48 48-48h352c26.51 0 48 21.49 48 48v352c0 26.51-21.49 48-48 48zM118.059 272.971l135.515 135.515c9.373 9.373 24.569 9.373 33.941 0l16.971-16.971c9.373-9.373 9.373-24.569 0-33.941L202.912 256l101.574-101.573c9.373-9.373 9.373-24.569 0-33.941l-16.971-16.971c-9.373-9.373-24.569-9.373-33.941 0L118.059 239.029c-9.373 9.373-9.373 24.569 0 33.942z"></path>
  </symbol>
  <symbol id="chevron-square-right" viewBox="0 0 448 512">
    <title id="chevron-square-right-title">Chevron Square Right</title>
    <path d="M48 32h352c26.51 0 48 21.49 48 48v352c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V80c0-26.51 21.49-48 48-48zm281.941 207.029L194.427 103.515c-9.373-9.373-24.569-9.373-33.941 0l-16.971 16.971c-9.373 9.373-9.373 24.569 0 33.941L245.088 256 143.515 357.573c-9.373 9.373-9.373 24.569 0 33.941l16.971 16.971c9.373 9.373 24.569 9.373 33.941 0L329.942 272.97c9.372-9.372 9.372-24.568-.001-33.941z"></path>
  </symbol>
  <symbol id="chevron-square-up" viewBox="0 0 448 512">
    <title id="chevron-square-up-title">Chevron Square Up</title>
    <path d="M0 432V80c0-26.51 21.49-48 48-48h352c26.51 0 48 21.49 48 48v352c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48zm207.029-281.941L71.515 285.573c-9.373 9.373-9.373 24.569 0 33.941l16.971 16.971c9.373 9.373 24.569 9.373 33.941 0L224 234.912l101.573 101.574c9.373 9.373 24.569 9.373 33.941 0l16.971-16.971c9.373-9.373 9.373-24.569 0-33.941L240.971 150.059c-9.373-9.373-24.569-9.373-33.942 0z"></path>
  </symbol>
  <symbol id="chevron-up" viewBox="0 0 448 512">
    <title id="chevron-up-title">chevron-up</title>
    <path d="M240.971 130.524l194.343 194.343c9.373 9.373 9.373 24.569 0 33.941l-22.667 22.667c-9.357 9.357-24.522 9.375-33.901.04L224 227.495 69.255 381.516c-9.379 9.335-24.544 9.317-33.901-.04l-22.667-22.667c-9.373-9.373-9.373-24.569 0-33.941L207.03 130.525c9.372-9.373 24.568-9.373 33.941-.001z"></path>
  </symbol>
  <symbol id="clock" viewBox="0 0 512 512">
    <title id="clock-title">Clock</title>
    <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm57.1 350.1L224.9 294c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12v137.7l63.5 46.2c5.4 3.9 6.5 11.4 2.6 16.8l-28.2 38.8c-3.9 5.3-11.4 6.5-16.8 2.6z"></path>
  </symbol>
  <symbol id="cog" viewBox="0 0 512 512">
    <title id="cog-title">cog</title>
    <path d="M444.788 291.1l42.616 24.599c4.867 2.809 7.126 8.618 5.459 13.985-11.07 35.642-29.97 67.842-54.689 94.586a12.016 12.016 0 0 1-14.832 2.254l-42.584-24.595a191.577 191.577 0 0 1-60.759 35.13v49.182a12.01 12.01 0 0 1-9.377 11.718c-34.956 7.85-72.499 8.256-109.219.007-5.49-1.233-9.403-6.096-9.403-11.723v-49.184a191.555 191.555 0 0 1-60.759-35.13l-42.584 24.595a12.016 12.016 0 0 1-14.832-2.254c-24.718-26.744-43.619-58.944-54.689-94.586-1.667-5.366.592-11.175 5.459-13.985L67.212 291.1a193.48 193.48 0 0 1 0-70.199l-42.616-24.599c-4.867-2.809-7.126-8.618-5.459-13.985 11.07-35.642 29.97-67.842 54.689-94.586a12.016 12.016 0 0 1 14.832-2.254l42.584 24.595a191.577 191.577 0 0 1 60.759-35.13V25.759a12.01 12.01 0 0 1 9.377-11.718c34.956-7.85 72.499-8.256 109.219-.007 5.49 1.233 9.403 6.096 9.403 11.723v49.184a191.555 191.555 0 0 1 60.759 35.13l42.584-24.595a12.016 12.016 0 0 1 14.832 2.254c24.718 26.744 43.619 58.944 54.689 94.586 1.667 5.366-.592 11.175-5.459 13.985L444.788 220.9a193.485 193.485 0 0 1 0 70.2zM336 256c0-44.112-35.888-80-80-80s-80 35.888-80 80 35.888 80 80 80 80-35.888 80-80z"></path>
  </symbol>
  <symbol id="comment" viewBox="0 0 576 512">
    <title id="comment-title">comment</title>
    <path d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path>
  </symbol>
  <symbol id="comments" viewBox="0 0 576 512">
    <title id="comments-title">comments</title>
    <path d="M224 358.857c-37.599 0-73.027-6.763-104.143-18.7-31.375 24.549-69.869 39.508-110.764 43.796a8.632 8.632 0 0 1-.89.047c-3.736 0-7.111-2.498-8.017-6.061-.98-3.961 2.088-6.399 5.126-9.305 15.017-14.439 33.222-25.79 40.342-74.297C17.015 266.886 0 232.622 0 195.429 0 105.16 100.297 32 224 32s224 73.159 224 163.429c-.001 90.332-100.297 163.428-224 163.428zm347.067 107.174c-13.944-13.127-30.849-23.446-37.46-67.543 68.808-64.568 52.171-156.935-37.674-207.065.031 1.334.066 2.667.066 4.006 0 122.493-129.583 216.394-284.252 211.222 38.121 30.961 93.989 50.492 156.252 50.492 34.914 0 67.811-6.148 96.704-17 29.134 22.317 64.878 35.916 102.853 39.814 3.786.395 7.363-1.973 8.27-5.467.911-3.601-1.938-5.817-4.759-8.459z"></path>
  </symbol>
  <symbol id="dollar-sign" viewBox="0 0 320 512">
    <title id="dollar-sign-title">Dollar Sign</title>
    <path d="M113.411 169.375c0-23.337 21.536-38.417 54.865-38.417 26.726 0 54.116 12.263 76.461 28.333 5.88 4.229 14.13 2.354 17.575-4.017l23.552-43.549c2.649-4.898 1.596-10.991-2.575-14.68-24.281-21.477-59.135-34.09-91.289-37.806V12c0-6.627-5.373-12-12-12h-40c-6.627 0-12 5.373-12 12v49.832c-58.627 13.29-97.299 55.917-97.299 108.639 0 123.533 184.765 110.81 184.765 169.414 0 19.823-16.311 41.158-52.124 41.158-30.751 0-62.932-15.88-87.848-35.887-5.31-4.264-13.082-3.315-17.159 2.14l-30.389 40.667c-3.627 4.854-3.075 11.657 1.302 15.847 24.049 23.02 59.249 41.255 98.751 47.973V500c0 6.627 5.373 12 12 12h40c6.627 0 12-5.373 12-12v-47.438c65.72-10.215 106.176-59.186 106.176-116.516.001-119.688-184.764-103.707-184.764-166.671z"></path>
  </symbol>
  <symbol id="download" viewBox="0 0 512 512">
    <title id="download-title">Download</title>
    <path d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"></path>
  </symbol>
  <symbol id="edit" viewBox="0 0 576 512">
    <title id="edit-title">Edit</title>
    <path d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"></path>
  </symbol>
  <symbol id="ellipsis-h" viewBox="0 0 512 512">
    <title id="ellipsis-h-title">Horizontal Ellipsis</title>
    <path d="M328 256c0 39.8-32.2 72-72 72s-72-32.2-72-72 32.2-72 72-72 72 32.2 72 72zm104-72c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72zm-352 0c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72z"></path>
  </symbol>
  <symbol id="ellipsis-v" viewBox="0 0 192 512">
    <title id="ellipsis-v-title">Vertical Ellipsis</title>
    <path d="M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z"></path>
  </symbol>
  <symbol id="envelope" viewBox="0 0 512 512">
    <title id="envelope-title">Envelope</title>
    <path d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"></path>
  </symbol>
  <symbol id="envelope-open" viewBox="0 0 512 512">
    <title id="envelope-open-title">Envelope Open</title>
    <path d="M512 464c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V200.724a48 48 0 0 1 18.387-37.776c24.913-19.529 45.501-35.365 164.2-121.511C199.412 29.17 232.797-.347 256 .003c23.198-.354 56.596 29.172 73.413 41.433 118.687 86.137 139.303 101.995 164.2 121.512A48 48 0 0 1 512 200.724V464zm-65.666-196.605c-2.563-3.728-7.7-4.595-11.339-1.907-22.845 16.873-55.462 40.705-105.582 77.079-16.825 12.266-50.21 41.781-73.413 41.43-23.211.344-56.559-29.143-73.413-41.43-50.114-36.37-82.734-60.204-105.582-77.079-3.639-2.688-8.776-1.821-11.339 1.907l-9.072 13.196a7.998 7.998 0 0 0 1.839 10.967c22.887 16.899 55.454 40.69 105.303 76.868 20.274 14.781 56.524 47.813 92.264 47.573 35.724.242 71.961-32.771 92.263-47.573 49.85-36.179 82.418-59.97 105.303-76.868a7.998 7.998 0 0 0 1.839-10.967l-9.071-13.196z"></path>
  </symbol>
  <symbol id="exclamation" viewBox="0 0 192 512">
    <title id="exclamation-title">exclamation</title>
    <path d="M176 432c0 44.112-35.888 80-80 80s-80-35.888-80-80 35.888-80 80-80 80 35.888 80 80zM25.26 25.199l13.6 272C39.499 309.972 50.041 320 62.83 320h66.34c12.789 0 23.331-10.028 23.97-22.801l13.6-272C167.425 11.49 156.496 0 142.77 0H49.23C35.504 0 24.575 11.49 25.26 25.199z"></path>
  </symbol>
  <symbol id="exclamation-circle" viewBox="0 0 512 512">
    <title id="exclamation-circle-title">Exclamation Circle</title>
    <path d="M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zm-248 50c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"></path>
  </symbol>
  <symbol id="exclamation-square" viewBox="0 0 448 512">
    <title id="exclamation-square-title">Exclamation Square</title>
    <path d="M400 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zm-207.691 96h63.382c6.884 0 12.357 5.78 11.982 12.654l-7.418 136c-.347 6.364-5.609 11.346-11.982 11.346h-48.546c-6.373 0-11.635-4.982-11.982-11.346l-7.418-136c-.375-6.874 5.098-12.654 11.982-12.654zM224 398c-25.405 0-46-20.595-46-46s20.595-46 46-46 46 20.595 46 46-20.595 46-46 46z"></path>
  </symbol>
  <symbol id="exclamation-triangle" viewBox="0 0 576 512">
    <title id="exclamation-triangle-title">Exclamation Triangle</title>
    <path d="M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"></path>
  </symbol>
  <symbol id="external-link" viewBox="0 0 576 512">
    <title id="external-link-title">External Link</title>
    <path d="M448 279.196V464c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V112c0-26.51 21.49-48 48-48h248a24 24 0 0 1 16.97 7.029l16 16C344.09 102.149 333.382 128 312 128H64v320h320V295.196c0-6.365 2.529-12.47 7.029-16.971l16-16C422.148 247.106 448 257.814 448 279.196zM576 37.333C576 16.715 559.285 0 538.667 0H380c-15.464 0-28 12.536-28 28v17.885c0 15.766 13.011 28.424 28.772 27.989l67.203-1.906L199.09 319.09c-9.429 9.363-9.457 24.605-.061 34.001l23.879 23.879c9.396 9.396 24.639 9.369 34.001-.06l247.122-248.885-1.906 67.203c-.434 15.76 12.224 28.772 27.99 28.772H548c15.464 0 28-12.536 28-28V37.333z"></path>
  </symbol>
  <symbol id="external-link-square" viewBox="0 0 448 512">
    <title id="external-link-square-title">External Link Square</title>
    <path d="M448 80v352c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V80c0-26.51 21.49-48 48-48h352c26.51 0 48 21.49 48 48zm-64 47.111C384 109.929 370.071 96 352.889 96H220.667c-12.887 0-23.333 10.447-23.333 23.334v14.904c0 13.138 10.843 23.686 23.976 23.324l56.002-1.588L69.908 361.908c-7.858 7.802-7.88 20.504-.05 28.334l19.899 19.899c7.83 7.83 20.532 7.808 28.334-.05l205.935-207.404-1.588 56.003c-.362 13.133 10.186 23.976 23.324 23.976h14.904c12.887 0 23.334-10.447 23.334-23.333V127.111z"></path>
  </symbol>
  <symbol id="fast-backward" viewBox="0 0 512 512">
    <title id="fast-backward-title">fast-backward</title>
    <path d="M0 436V76c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v151.9L235.5 71.4C256.1 54.3 288 68.6 288 96v131.9L459.5 71.4C480.1 54.3 512 68.6 512 96v320c0 27.4-31.9 41.7-52.5 24.6L288 285.3V416c0 27.4-31.9 41.7-52.5 24.6L64 285.3V436c0 6.6-5.4 12-12 12H12c-6.6 0-12-5.4-12-12z"></path>
  </symbol>
  <symbol id="fast-forward" viewBox="0 0 512 512">
    <title id="fast-forward-title">fast-forward</title>
    <path d="M512 76v360c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12V284.1L276.5 440.6c-20.6 17.2-52.5 2.8-52.5-24.6V284.1L52.5 440.6C31.9 457.8 0 443.4 0 416V96c0-27.4 31.9-41.7 52.5-24.6L224 226.8V96c0-27.4 31.9-41.7 52.5-24.6L448 226.8V76c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12z"></path>
  </symbol>
  <symbol id="file" viewBox="0 0 384 512">
    <title id="file-title">File</title>
    <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
  </symbol>
  <symbol id="file-alt" viewBox="0 0 384 512">
    <title id="file-alt-title">Alternate File</title>
    <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm64 236c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12v8zm0-64c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12v8zm0-72v8c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12zm96-114.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
  </symbol>
  <symbol id="file-archive" viewBox="0 0 384 512">
    <title id="file-archive-title">Archive File</title>
    <path d="M224 136V0h-63.6v32h-32V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zM95.9 32h32v32h-32V32zm32.3 384c-33.2 0-58-30.4-51.4-62.9L96.4 256v-32h32v-32h-32v-32h32v-32h-32V96h32V64h32v32h-32v32h32v32h-32v32h32v32h-32v32h22.1c5.7 0 10.7 4.1 11.8 9.7l17.3 87.7c6.4 32.4-18.4 62.6-51.4 62.6zm32.7-53c0 14.9-14.5 27-32.4 27S96 378 96 363c0-14.9 14.5-27 32.4-27s32.5 12.1 32.5 27zM384 121.9v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
  </symbol>
  <symbol id="file-check" viewBox="0 0 384 512">
    <title id="file-check-title">Check File</title>
    <path d="M384 121.941V128H256V0h6.059c6.365 0 12.47 2.529 16.971 7.029l97.941 97.941A24.005 24.005 0 0 1 384 121.941zM248 160h136v328c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24V24C0 10.745 10.745 0 24 0h200v136c0 13.2 10.8 24 24 24zm65.296 109.732l-28.169-28.398c-4.667-4.705-12.265-4.736-16.97-.068L162.12 346.45l-45.98-46.352c-4.667-4.705-12.266-4.736-16.971-.068L70.772 328.2c-4.705 4.667-4.736 12.265-.068 16.97l82.601 83.269c4.667 4.705 12.265 4.736 16.97.068l142.953-141.805c4.705-4.667 4.736-12.265.068-16.97z"></path>
  </symbol>
  <symbol id="file-pdf" viewBox="0 0 384 512">
    <title id="file-pdf-title">PDF File</title>
    <path d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z"></path>
  </symbol>
  <symbol id="file-word" viewBox="0 0 384 512">
    <title id="file-word-title">Word File</title>
    <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm57.1 120H305c7.7 0 13.4 7.1 11.7 14.7l-38 168c-1.2 5.5-6.1 9.3-11.7 9.3h-38c-5.5 0-10.3-3.8-11.6-9.1-25.8-103.5-20.8-81.2-25.6-110.5h-.5c-1.1 14.3-2.4 17.4-25.6 110.5-1.3 5.3-6.1 9.1-11.6 9.1H117c-5.6 0-10.5-3.9-11.7-9.4l-37.8-168c-1.7-7.5 4-14.6 11.7-14.6h24.5c5.7 0 10.7 4 11.8 9.7 15.6 78 20.1 109.5 21 122.2 1.6-10.2 7.3-32.7 29.4-122.7 1.3-5.4 6.1-9.1 11.7-9.1h29.1c5.6 0 10.4 3.8 11.7 9.2 24 100.4 28.8 124 29.6 129.4-.2-11.2-2.6-17.8 21.6-129.2 1-5.6 5.9-9.5 11.5-9.5zM384 121.9v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
  </symbol>
  <symbol id="filter" viewBox="0 0 512 512">
    <title id="filter-title">Filter</title>
    <path d="M487.976 0H24.028C2.71 0-8.047 25.866 7.058 40.971L192 225.941V432c0 7.831 3.821 15.17 10.237 19.662l80 55.98C298.02 518.69 320 507.493 320 487.98V225.941l184.947-184.97C520.021 25.896 509.338 0 487.976 0z"></path>
  </symbol>
  <symbol id="flag" viewBox="0 0 512 512">
    <title id="flag-title">flag</title>
    <path d="M349.565 98.783C295.978 98.783 251.721 64 184.348 64c-24.955 0-47.309 4.384-68.045 12.013a55.947 55.947 0 0 0 3.586-23.562C118.117 24.015 94.806 1.206 66.338.048 34.345-1.254 8 24.296 8 56c0 19.026 9.497 35.825 24 45.945V488c0 13.255 10.745 24 24 24h16c13.255 0 24-10.745 24-24v-94.4c28.311-12.064 63.582-22.122 114.435-22.122 53.588 0 97.844 34.783 165.217 34.783 48.169 0 86.667-16.294 122.505-40.858C506.84 359.452 512 349.571 512 339.045v-243.1c0-23.393-24.269-38.87-45.485-29.016-34.338 15.948-76.454 31.854-116.95 31.854z"></path>
  </symbol>
  <symbol id="forward" viewBox="0 0 512 512">
    <title id="forward-title">forward</title>
    <path d="M500.5 231.4l-192-160C287.9 54.3 256 68.6 256 96v320c0 27.4 31.9 41.8 52.5 24.6l192-160c15.3-12.8 15.3-36.4 0-49.2zm-256 0l-192-160C31.9 54.3 0 68.6 0 96v320c0 27.4 31.9 41.8 52.5 24.6l192-160c15.3-12.8 15.3-36.4 0-49.2z"></path>
  </symbol>
  <symbol id="heart" viewBox="0 0 576 512">
    <title id="heart-title">Heart</title>
    <path d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path>
  </symbol>
  <symbol id="id-card" viewBox="0 0 512 512">
    <title id="id-card-title">Identification Card</title>
    <path d="M464 448H48c-26.51 0-48-21.49-48-48V112c0-26.51 21.49-48 48-48h416c26.51 0 48 21.49 48 48v288c0 26.51-21.49 48-48 48zM160 160c-35.346 0-64 28.654-64 64s28.654 64 64 64 64-28.654 64-64-28.654-64-64-64m79.589 154.53l-28.281-9.427C196.458 314.532 178.856 320 160 320s-36.458-5.468-51.309-14.897L80.41 314.53A24 24 0 0 0 64 337.298V360c0 13.255 10.745 24 24 24h144c13.255 0 24-10.745 24-24v-22.702a24 24 0 0 0-16.411-22.768zM448 340v-8c0-6.627-5.373-12-12-12H300c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h136c6.627 0 12-5.373 12-12zm0-64v-8c0-6.627-5.373-12-12-12H300c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h136c6.627 0 12-5.373 12-12zm0-64v-8c0-6.627-5.373-12-12-12H300c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h136c6.627 0 12-5.373 12-12zm32-96v-8c0-6.627-5.373-12-12-12H44c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h424c6.627 0 12-5.373 12-12z"></path>
  </symbol>
  <symbol id="inbox" viewBox="0 0 576 512">
    <title id="inbox-title">inbox</title>
    <path d="M567.938 243.908L462.25 85.374A48.003 48.003 0 0 0 422.311 64H153.689a48 48 0 0 0-39.938 21.374L8.062 243.908A47.994 47.994 0 0 0 0 270.533V400c0 26.51 21.49 48 48 48h480c26.51 0 48-21.49 48-48V270.533a47.994 47.994 0 0 0-8.062-26.625zM162.252 128h251.497l85.333 128H376l-32 64H232l-32-64H76.918l85.334-128z"></path>
  </symbol>
  <symbol id="inbox-in" viewBox="0 0 576 512">
    <title id="inbox-in-title">Inbox In</title>
    <path d="M250.5 0h68.6c9.5 0 17.1 7.7 17.1 17.1V160h68.3c17.8 0 26.7 21.5 14.1 34.1l-119.4 120c-7.9 7.9-20.9 7.8-28.6-.3L157 193.8c-12.1-12.7-3.1-33.8 14.5-33.8h61.9V17.1c0-9.4 7.7-17.1 17.1-17.1zm315 338.9l-94.6-118.2c-4.5-5.6-13-6-18-.9l-28.1 28.9c-4.2 4.3-4.5 11.1-.8 15.9l44.3 55.4H376l-32 64H232l-32-64h-92.4l43.8-54.7c3.7-4.7 3.5-11.4-.6-15.7l-27.6-29.5c-5-5.3-13.6-5-18.1.7l-94.4 118c-7 8.6-10.7 19.1-10.7 30V464c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48v-95.2c0-10.9-3.7-21.4-10.5-29.9z"></path>
  </symbol>
  <symbol id="inbox-out" viewBox="0 0 576 512">
    <title id="inbox-out-title">Inbox Out</title>
    <path d="M576 368.8V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48v-95.2c0-10.9 3.7-21.5 10.5-30l94.4-118c4.6-5.7 13.1-6 18.1-.7l27.6 29.5c4.1 4.4 4.3 11 .6 15.7L107.6 320H200l32 64h112l32-64h92.4l-44.3-55.4c-3.8-4.7-3.5-11.5.8-15.9l28.1-28.9c5-5.2 13.5-4.8 18 .9l94.6 118.2c6.7 8.5 10.4 19 10.4 29.9zm-233.4-65.9V160h61.9c17.6 0 26.6-21.1 14.5-33.8L305.3 6.2c-7.7-8.1-20.7-8.3-28.6-.3l-119.4 120c-12.6 12.6-3.7 34.1 14.1 34.1h68.3v142.9c0 9.5 7.7 17.1 17.1 17.1h68.6c9.5 0 17.2-7.7 17.2-17.1z"></path>
  </symbol>
  <symbol id="info" viewBox="0 0 192 512">
    <title id="info-title">Info</title>
    <path d="M20 424.229h20V279.771H20c-11.046 0-20-8.954-20-20V212c0-11.046 8.954-20 20-20h112c11.046 0 20 8.954 20 20v212.229h20c11.046 0 20 8.954 20 20V492c0 11.046-8.954 20-20 20H20c-11.046 0-20-8.954-20-20v-47.771c0-11.046 8.954-20 20-20zM96 0C56.235 0 24 32.235 24 72s32.235 72 72 72 72-32.235 72-72S135.764 0 96 0z"></path>
  </symbol>
  <symbol id="info-circle" viewBox="0 0 512 512">
    <title id="info-circle-title">Info Circle</title>
    <path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"></path>
  </symbol>
  <symbol id="info-square" viewBox="0 0 448 512">
    <title id="info-square-title">Info Square</title>
    <path d="M400 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zm-176 86c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"></path>
  </symbol>
  <symbol id="life-ring" viewBox="0 0 512 512">
    <title id="life-ring-title">Life Ring</title>
    <path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm173.696 119.559l-63.399 63.399c-10.987-18.559-26.67-34.252-45.255-45.255l63.399-63.399a218.396 218.396 0 0 1 45.255 45.255zM256 352c-53.019 0-96-42.981-96-96s42.981-96 96-96 96 42.981 96 96-42.981 96-96 96zM127.559 82.304l63.399 63.399c-18.559 10.987-34.252 26.67-45.255 45.255l-63.399-63.399a218.372 218.372 0 0 1 45.255-45.255zM82.304 384.441l63.399-63.399c10.987 18.559 26.67 34.252 45.255 45.255l-63.399 63.399a218.396 218.396 0 0 1-45.255-45.255zm302.137 45.255l-63.399-63.399c18.559-10.987 34.252-26.67 45.255-45.255l63.399 63.399a218.403 218.403 0 0 1-45.255 45.255z"></path>
  </symbol>
  <symbol id="lightbulb" viewBox="0 0 384 512">
    <title id="lightbulb-title">Lightbulb</title>
    <path d="M272 428v28c0 10.449-6.68 19.334-16 22.629V488c0 13.255-10.745 24-24 24h-80c-13.255 0-24-10.745-24-24v-9.371c-9.32-3.295-16-12.18-16-22.629v-28c0-6.627 5.373-12 12-12h136c6.627 0 12 5.373 12 12zm-143.107-44c-9.907 0-18.826-6.078-22.376-15.327C67.697 267.541 16 277.731 16 176 16 78.803 94.805 0 192 0s176 78.803 176 176c0 101.731-51.697 91.541-90.516 192.673-3.55 9.249-12.47 15.327-22.376 15.327H128.893zM112 176c0-44.112 35.888-80 80-80 8.837 0 16-7.164 16-16s-7.163-16-16-16c-61.757 0-112 50.243-112 112 0 8.836 7.164 16 16 16s16-7.164 16-16z"></path>
  </symbol>
  <symbol id="list" viewBox="0 0 512 512">
    <title id="list-title">list</title>
    <path d="M128 116V76c0-8.837 7.163-16 16-16h352c8.837 0 16 7.163 16 16v40c0 8.837-7.163 16-16 16H144c-8.837 0-16-7.163-16-16zm16 176h352c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H144c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h352c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H144c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zM16 144h64c8.837 0 16-7.163 16-16V64c0-8.837-7.163-16-16-16H16C7.163 48 0 55.163 0 64v64c0 8.837 7.163 16 16 16zm0 160h64c8.837 0 16-7.163 16-16v-64c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v64c0 8.837 7.163 16 16 16zm0 160h64c8.837 0 16-7.163 16-16v-64c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v64c0 8.837 7.163 16 16 16z"></path>
  </symbol>
  <symbol id="lock" viewBox="0 0 448 512">
    <title id="lock-title">lock</title>
    <path d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"></path>
  </symbol>
  <symbol id="lock-open" viewBox="0 0 576 512">
    <title id="lock-open-title">Lock Open</title>
    <path d="M423.5 0C339.5.3 272 69.5 272 153.5V224H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48h-48v-71.1c0-39.6 31.7-72.5 71.3-72.9 40-.4 72.7 32.1 72.7 72v80c0 13.3 10.7 24 24 24h32c13.3 0 24-10.7 24-24v-80C576 68 507.5-.3 423.5 0z"></path>
  </symbol>
  <symbol id="long-arrow-alt-down" viewBox="0 0 256 512">
    <title id="long-arrow-alt-down-title">Alternate Long Arrow Down</title>
    <path d="M168 345.941V44c0-6.627-5.373-12-12-12h-56c-6.627 0-12 5.373-12 12v301.941H41.941c-21.382 0-32.09 25.851-16.971 40.971l86.059 86.059c9.373 9.373 24.569 9.373 33.941 0l86.059-86.059c15.119-15.119 4.411-40.971-16.971-40.971H168z"></path>
  </symbol>
  <symbol id="long-arrow-alt-left" viewBox="0 0 448 512">
    <title id="long-arrow-alt-left-title">Alternate Long Arrow Left</title>
    <path d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z"></path>
  </symbol>
  <symbol id="long-arrow-alt-right" viewBox="0 0 448 512">
    <title id="long-arrow-alt-right-title">Alternate Long Arrow Right</title>
    <path d="M313.941 216H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h301.941v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971 16.971V216z"></path>
  </symbol>
  <symbol id="long-arrow-alt-up" viewBox="0 0 256 512">
    <title id="long-arrow-alt-up-title">Alternate Long Arrow Up</title>
    <path d="M88 166.059V468c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12V166.059h46.059c21.382 0 32.09-25.851 16.971-40.971l-86.059-86.059c-9.373-9.373-24.569-9.373-33.941 0l-86.059 86.059c-15.119 15.119-4.411 40.971 16.971 40.971H88z"></path>
  </symbol>
  <symbol id="long-arrow-down" viewBox="0 0 320 512">
    <title id="long-arrow-down-title">Long Arrow Down</title>
    <path d="M261.573 286.544L196 352.118V56c0-13.255-10.745-24-24-24h-24c-13.255 0-24 10.745-24 24v296.118l-65.573-65.574c-9.373-9.373-24.569-9.373-33.941 0L7.515 303.515c-9.373 9.373-9.373 24.569 0 33.941L143.03 472.97c9.373 9.373 24.568 9.373 33.941 0l135.515-135.514c9.373-9.373 9.373-24.569 0-33.941l-16.971-16.971c-9.373-9.373-24.569-9.373-33.942 0z"></path>
  </symbol>
  <symbol id="long-arrow-left" viewBox="0 0 448 512">
    <title id="long-arrow-left-title">Long Arrow Left</title>
    <path d="M193.456 357.573L127.882 292H424c13.255 0 24-10.745 24-24v-24c0-13.255-10.745-24-24-24H127.882l65.574-65.573c9.373-9.373 9.373-24.569 0-33.941l-16.971-16.971c-9.373-9.373-24.569-9.373-33.941 0L7.029 239.029c-9.373 9.373-9.373 24.568 0 33.941l135.515 135.515c9.373 9.373 24.569 9.373 33.941 0l16.971-16.971c9.373-9.372 9.373-24.568 0-33.941z"></path>
  </symbol>
  <symbol id="long-arrow-right" viewBox="0 0 448 512">
    <title id="long-arrow-right-title">Long Arrow Right</title>
    <path d="M254.544 154.427L320.118 220H24c-13.255 0-24 10.745-24 24v24c0 13.255 10.745 24 24 24h296.118l-65.574 65.573c-9.373 9.373-9.373 24.569 0 33.941l16.971 16.971c9.373 9.373 24.569 9.373 33.941 0L440.97 272.97c9.373-9.373 9.373-24.569 0-33.941L305.456 103.515c-9.373-9.373-24.569-9.373-33.941 0l-16.971 16.971c-9.373 9.372-9.373 24.568 0 33.941z"></path>
  </symbol>
  <symbol id="long-arrow-up" viewBox="0 0 320 512">
    <title id="long-arrow-up-title">Long Arrow Up</title>
    <path d="M58.427 225.456L124 159.882V456c0 13.255 10.745 24 24 24h24c13.255 0 24-10.745 24-24V159.882l65.573 65.574c9.373 9.373 24.569 9.373 33.941 0l16.971-16.971c9.373-9.373 9.373-24.569 0-33.941L176.971 39.029c-9.373-9.373-24.568-9.373-33.941 0L7.515 174.544c-9.373 9.373-9.373 24.569 0 33.941l16.971 16.971c9.372 9.373 24.568 9.373 33.941 0z"></path>
  </symbol>
  <symbol id="minus" viewBox="0 0 448 512">
    <title id="minus-title">minus</title>
    <path d="M424 318.2c13.3 0 24-10.7 24-24v-76.4c0-13.3-10.7-24-24-24H24c-13.3 0-24 10.7-24 24v76.4c0 13.3 10.7 24 24 24h400z"></path>
  </symbol>
  <symbol id="minus-circle" viewBox="0 0 512 512">
    <title id="minus-circle-title">Minus Circle</title>
    <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zM124 296c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h264c6.6 0 12 5.4 12 12v56c0 6.6-5.4 12-12 12H124z"></path>
  </symbol>
  <symbol id="pen" viewBox="0 0 512 512">
    <title id="pen-title">Pen</title>
    <path d="M301.2 99.8l111 111c4.7 4.7 4.7 12.3 0 17L140.8 499.2 26.7 511.8C11.4 513.5-1.5 500.6.2 485.3l12.7-114.2L284.2 99.8c4.7-4.7 12.3-4.7 17 0zm196.7-25.6l-60.1-60.1c-18.7-18.7-49.1-18.7-67.9 0l-46.1 46.1c-4.7 4.7-4.7 12.3 0 17l111 111c4.7 4.7 12.3 4.7 17 0l46.1-46.1c18.8-18.8 18.8-49.2 0-67.9z"></path>
  </symbol>
  <symbol id="percent" viewBox="0 0 448 512">
    <title id="percent-title">Percent</title>
    <path d="M112 224c61.9 0 112-50.1 112-112S173.9 0 112 0 0 50.1 0 112s50.1 112 112 112zm0-160c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zm224 224c-61.9 0-112 50.1-112 112s50.1 112 112 112 112-50.1 112-112-50.1-112-112-112zm0 160c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zM392.3.2l31.6-.1c19.4-.1 30.9 21.8 19.7 37.8L77.4 501.6a23.95 23.95 0 0 1-19.6 10.2l-33.4.1c-19.5 0-30.9-21.9-19.7-37.8l368-463.7C377.2 4 384.5.2 392.3.2z"></path>
  </symbol>
  <symbol id="phone" viewBox="0 0 512 512">
    <title id="phone-title">Phone</title>
    <path d="M493.397 24.615l-104-23.997c-11.314-2.611-22.879 3.252-27.456 13.931l-48 111.997a24 24 0 0 0 6.862 28.029l60.617 49.596c-35.973 76.675-98.938 140.508-177.249 177.248l-49.596-60.616a24 24 0 0 0-28.029-6.862l-111.997 48C3.873 366.516-1.994 378.08.618 389.397l23.997 104C27.109 504.204 36.748 512 48 512c256.087 0 464-207.532 464-464 0-11.176-7.714-20.873-18.603-23.385z"></path>
  </symbol>
  <symbol id="plus" viewBox="0 0 448 512">
    <title id="plus-title">plus</title>
    <path d="M448 294.2v-76.4c0-13.3-10.7-24-24-24H286.2V56c0-13.3-10.7-24-24-24h-76.4c-13.3 0-24 10.7-24 24v137.8H24c-13.3 0-24 10.7-24 24v76.4c0 13.3 10.7 24 24 24h137.8V456c0 13.3 10.7 24 24 24h76.4c13.3 0 24-10.7 24-24V318.2H424c13.3 0 24-10.7 24-24z"></path>
  </symbol>
  <symbol id="plus-circle" viewBox="0 0 512 512">
    <title id="plus-circle-title">Plus Circle</title>
    <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"></path>
  </symbol>
  <symbol id="plus-square" viewBox="0 0 448 512">
    <title id="plus-square-title">Plus Square</title>
    <path d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-32 252c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92H92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"></path>
  </symbol>
  <symbol id="print" viewBox="0 0 512 512">
    <title id="print-title">print</title>
    <path d="M464 192h-16V81.941a24 24 0 0 0-7.029-16.97L383.029 7.029A24 24 0 0 0 366.059 0H88C74.745 0 64 10.745 64 24v168H48c-26.51 0-48 21.49-48 48v132c0 6.627 5.373 12 12 12h52v104c0 13.255 10.745 24 24 24h336c13.255 0 24-10.745 24-24V384h52c6.627 0 12-5.373 12-12V240c0-26.51-21.49-48-48-48zm-80 256H128v-96h256v96zM128 224V64h192v40c0 13.2 10.8 24 24 24h40v96H128zm304 72c-13.254 0-24-10.746-24-24s10.746-24 24-24 24 10.746 24 24-10.746 24-24 24z"></path>
  </symbol>
  <symbol id="question" viewBox="0 0 384 512">
    <title id="question-title">Question</title>
    <path d="M202.021 0C122.202 0 70.503 32.703 29.914 91.026c-7.363 10.58-5.093 25.086 5.178 32.874l43.138 32.709c10.373 7.865 25.132 6.026 33.253-4.148 25.049-31.381 43.63-49.449 82.757-49.449 30.764 0 68.816 19.799 68.816 49.631 0 22.552-18.617 34.134-48.993 51.164-35.423 19.86-82.299 44.576-82.299 106.405V320c0 13.255 10.745 24 24 24h72.471c13.255 0 24-10.745 24-24v-5.773c0-42.86 125.268-44.645 125.268-160.627C377.504 66.256 286.902 0 202.021 0zM192 373.459c-38.196 0-69.271 31.075-69.271 69.271 0 38.195 31.075 69.27 69.271 69.27s69.271-31.075 69.271-69.271-31.075-69.27-69.271-69.27z"></path>
  </symbol>
  <symbol id="question-circle" viewBox="0 0 512 512">
    <title id="question-circle-title">Question Circle</title>
    <path d="M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zM262.655 90c-54.497 0-89.255 22.957-116.549 63.758-3.536 5.286-2.353 12.415 2.715 16.258l34.699 26.31c5.205 3.947 12.621 3.008 16.665-2.122 17.864-22.658 30.113-35.797 57.303-35.797 20.429 0 45.698 13.148 45.698 32.958 0 14.976-12.363 22.667-32.534 33.976C247.128 238.528 216 254.941 216 296v4c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12v-1.333c0-28.462 83.186-29.647 83.186-106.667 0-58.002-60.165-102-116.531-102zM256 338c-25.365 0-46 20.635-46 46 0 25.364 20.635 46 46 46s46-20.636 46-46c0-25.365-20.635-46-46-46z"></path>
  </symbol>
  <symbol id="question-square" viewBox="0 0 448 512">
    <title id="question-square-title">Question Square</title>
    <path d="M400 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zM224 430c-25.365 0-46-20.636-46-46 0-25.365 20.635-46 46-46s46 20.635 46 46c0 25.364-20.635 46-46 46zm40-131.333V300c0 6.627-5.373 12-12 12h-56c-6.627 0-12-5.373-12-12v-4c0-41.059 31.128-57.472 54.652-70.66 20.171-11.309 32.534-19 32.534-33.976 0-19.81-25.269-32.958-45.698-32.958-27.19 0-39.438 13.139-57.303 35.797-4.045 5.13-11.46 6.069-16.665 2.122l-34.699-26.31c-5.068-3.843-6.251-10.972-2.715-16.258C141.4 112.957 176.158 90 230.655 90c56.366 0 116.531 43.998 116.531 102 0 77.02-83.186 78.205-83.186 106.667z"></path>
  </symbol>
  <symbol id="redo" viewBox="0 0 512.333 512">
    <title id="redo-title">Redo</title>
    <path d="M500.333 0h-47.411c-6.853 0-12.314 5.729-11.986 12.574l3.966 82.759C399.416 41.899 331.672 8 256.001 8 119.34 8 7.899 119.526 8 256.187 8.101 393.068 119.096 504 256 504c63.926 0 122.202-24.187 166.178-63.908 5.113-4.618 5.354-12.561.482-17.433l-33.971-33.971c-4.466-4.466-11.64-4.717-16.38-.543C341.308 415.448 300.606 432 256 432c-97.267 0-176-78.716-176-176 0-97.267 78.716-176 176-176 60.892 0 114.506 30.858 146.099 77.8l-101.525-4.865c-6.845-.328-12.574 5.133-12.574 11.986v47.411c0 6.627 5.373 12 12 12h200.333c6.627 0 12-5.373 12-12V12c0-6.627-5.373-12-12-12z"></path>
  </symbol>
  <symbol id="save" viewBox="0 0 448 512">
    <title id="save-title">Save</title>
    <path d="M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"></path>
  </symbol>
  <symbol id="search" viewBox="0 0 512 512">
    <title id="search-title">Search</title>
    <path d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path>
  </symbol>
  <symbol id="sign-in" viewBox="0 0 512 512">
    <title id="sign-in-title">Sign In</title>
    <path d="M137.2 110.3l21.9-21.9c9.3-9.3 24.5-9.4 33.9-.1L344.9 239c9.5 9.4 9.5 24.7 0 34.1L193 423.7c-9.4 9.3-24.5 9.3-33.9-.1l-21.9-21.9c-9.7-9.7-9.3-25.4.8-34.7l77.6-71.1H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h191.5l-77.6-71.1c-10-9.1-10.4-24.9-.7-34.5zM512 352V160c0-53-43-96-96-96h-84c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h84c17.7 0 32 14.3 32 32v192c0 17.7-14.3 32-32 32h-84c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h84c53 0 96-43 96-96z"></path>
  </symbol>
  <symbol id="sign-out" viewBox="0 0 512 512">
    <title id="sign-out-title">Sign Out</title>
    <path d="M180 448H96c-53 0-96-43-96-96V160c0-53 43-96 96-96h84c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H96c-17.7 0-32 14.3-32 32v192c0 17.7 14.3 32 32 32h84c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12zm117.9-303.1l77.6 71.1H184c-13.3 0-24 10.7-24 24v32c0 13.3 10.7 24 24 24h191.5l-77.6 71.1c-10.1 9.2-10.4 25-.8 34.7l21.9 21.9c9.3 9.3 24.5 9.4 33.9.1l152-150.8c9.5-9.4 9.5-24.7 0-34.1L353 88.3c-9.4-9.3-24.5-9.3-33.9.1l-21.9 21.9c-9.7 9.6-9.3 25.4.7 34.6z"></path>
  </symbol>
  <symbol id="sort" viewBox="0 0 320 512">
    <title id="sort-title">Sort</title>
    <path d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41zm255-105L177 64c-9.4-9.4-24.6-9.4-33.9 0L24 183c-15.1 15.1-4.4 41 17 41h238c21.4 0 32.1-25.9 17-41z"></path>
  </symbol>
  <symbol id="sort-alpha-down" viewBox="0 0 448 512">
    <title id="sort-alpha-down-title">Sort Alpha Down</title>
    <path d="M187.298 395.314l-79.984 80.002c-6.248 6.247-16.383 6.245-22.627 0L4.705 395.314C-5.365 385.244 1.807 368 16.019 368H64V48c0-8.837 7.163-16 16-16h32c8.837 0 16 7.163 16 16v320h47.984c14.241 0 21.363 17.264 11.314 27.314zm119.075-180.007A12 12 0 0 1 294.838 224h-35.717c-8.22 0-14.007-8.078-11.362-15.861l57.096-168A12 12 0 0 1 316.217 32h39.566c5.139 0 9.708 3.273 11.362 8.139l57.096 168C426.886 215.922 421.1 224 412.879 224h-35.735a12 12 0 0 1-11.515-8.622l-8.301-28.299h-42.863l-8.092 28.228zm22.857-78.697h13.367l-6.6-22.937-6.767 22.937zm12.575 287.323l67.451-95.698a12 12 0 0 0 2.192-6.913V300c0-6.627-5.373-12-12-12H274.522c-6.627 0-12 5.373-12 12v28.93c0 6.627 5.373 12 12 12h56.469c-.739.991-1.497 2.036-2.27 3.133l-67.203 95.205a12.001 12.001 0 0 0-2.196 6.92V468c0 6.627 5.373 12 12 12h129.355c6.627 0 12-5.373 12-12v-28.93c0-6.627-5.373-12-12-12h-61.146c.74-.993 1.5-2.039 2.274-3.137z"></path>
  </symbol>
  <symbol id="sort-alpha-up" viewBox="0 0 448 512">
    <title id="sort-alpha-up-title">Sort Alpha Up</title>
    <path d="M4.702 116.686l79.984-80.002c6.248-6.247 16.383-6.245 22.627 0l79.981 80.002c10.07 10.07 2.899 27.314-11.314 27.314H128v320c0 8.837-7.163 16-16 16H80c-8.837 0-16-7.163-16-16V144H16.016c-14.241 0-21.363-17.264-11.314-27.314zm301.671 98.621A12 12 0 0 1 294.838 224h-35.717c-8.22 0-14.007-8.078-11.362-15.861l57.096-168A12 12 0 0 1 316.217 32h39.566c5.139 0 9.708 3.273 11.362 8.139l57.096 168C426.886 215.922 421.1 224 412.879 224h-35.735a12 12 0 0 1-11.515-8.622l-8.301-28.299h-42.863l-8.092 28.228zm22.857-78.697h13.367l-6.6-22.937-6.767 22.937zm12.575 287.323l67.451-95.698a12 12 0 0 0 2.192-6.913V300c0-6.627-5.373-12-12-12H274.522c-6.627 0-12 5.373-12 12v28.93c0 6.627 5.373 12 12 12h56.469c-.739.991-1.497 2.036-2.27 3.133l-67.203 95.205a12.001 12.001 0 0 0-2.196 6.92V468c0 6.627 5.373 12 12 12h129.355c6.627 0 12-5.373 12-12v-28.93c0-6.627-5.373-12-12-12h-61.146c.74-.993 1.5-2.039 2.274-3.137z"></path>
  </symbol>
  <symbol id="sort-amount-down" viewBox="0 0 512 512">
    <title id="sort-amount-down-title">Sort Amount Down</title>
    <path d="M187.298 395.314l-79.984 80.002c-6.248 6.247-16.383 6.245-22.627 0L4.705 395.314C-5.365 385.244 1.807 368 16.019 368H64V48c0-8.837 7.163-16 16-16h32c8.837 0 16 7.163 16 16v320h47.984c14.241 0 21.363 17.264 11.314 27.314zM240 96h256c8.837 0 16-7.163 16-16V48c0-8.837-7.163-16-16-16H240c-8.837 0-16 7.163-16 16v32c0 8.837 7.163 16 16 16zm-16 112v-32c0-8.837 7.163-16 16-16h192c8.837 0 16 7.163 16 16v32c0 8.837-7.163 16-16 16H240c-8.837 0-16-7.163-16-16zm0 256v-32c0-8.837 7.163-16 16-16h64c8.837 0 16 7.163 16 16v32c0 8.837-7.163 16-16 16h-64c-8.837 0-16-7.163-16-16zm0-128v-32c0-8.837 7.163-16 16-16h128c8.837 0 16 7.163 16 16v32c0 8.837-7.163 16-16 16H240c-8.837 0-16-7.163-16-16z"></path>
  </symbol>
  <symbol id="sort-amount-up" viewBox="0 0 512 512">
    <title id="sort-amount-up-title">Sort Amount Up</title>
    <path d="M4.702 116.686l79.984-80.002c6.248-6.247 16.383-6.245 22.627 0l79.981 80.002c10.07 10.07 2.899 27.314-11.314 27.314H128v320c0 8.837-7.163 16-16 16H80c-8.837 0-16-7.163-16-16V144H16.016c-14.241 0-21.363-17.264-11.314-27.314zM240 96h256c8.837 0 16-7.163 16-16V48c0-8.837-7.163-16-16-16H240c-8.837 0-16 7.163-16 16v32c0 8.837 7.163 16 16 16zm-16 112v-32c0-8.837 7.163-16 16-16h192c8.837 0 16 7.163 16 16v32c0 8.837-7.163 16-16 16H240c-8.837 0-16-7.163-16-16zm0 256v-32c0-8.837 7.163-16 16-16h64c8.837 0 16 7.163 16 16v32c0 8.837-7.163 16-16 16h-64c-8.837 0-16-7.163-16-16zm0-128v-32c0-8.837 7.163-16 16-16h128c8.837 0 16 7.163 16 16v32c0 8.837-7.163 16-16 16H240c-8.837 0-16-7.163-16-16z"></path>
  </symbol>
  <symbol id="sort-down" viewBox="0 0 320 512">
    <title id="sort-down-title">Sort Down (Descending)</title>
    <path d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41z"></path>
  </symbol>
  <symbol id="sort-numeric-down" viewBox="0 0 448 512">
    <title id="sort-numeric-down-title">Sort Numeric Down</title>
    <path d="M308.811 113.787l-19.448-20.795c-4.522-4.836-4.274-12.421.556-16.95l43.443-40.741a11.999 11.999 0 0 1 8.209-3.247h31.591c6.627 0 12 5.373 12 12v127.07h25.66c6.627 0 12 5.373 12 12v28.93c0 6.627-5.373 12-12 12H301.649c-6.627 0-12-5.373-12-12v-28.93c0-6.627 5.373-12 12-12h25.414v-57.938c-7.254 6.58-14.211 4.921-18.252.601zm-30.57 238.569c0-32.653 23.865-67.356 68.094-67.356 38.253 0 79.424 28.861 79.424 92.228 0 51.276-32.237 105.772-91.983 105.772-17.836 0-30.546-3.557-38.548-6.781-5.79-2.333-8.789-8.746-6.922-14.703l9.237-29.48c2.035-6.496 9.049-9.983 15.467-7.716 13.029 4.602 27.878 5.275 38.103-4.138-38.742 5.072-72.872-25.36-72.872-67.826zm92.273 19.338c0-22.285-15.302-36.505-25.835-36.505-8.642 0-13.164 7.965-13.164 15.832 0 5.669 1.815 24.168 25.168 24.168 9.973 0 13.377-2.154 13.744-2.731.021-.046.087-.291.087-.764zM175.984 368H128V48c0-8.837-7.163-16-16-16H80c-8.837 0-16 7.163-16 16v320H16.019c-14.212 0-21.384 17.244-11.314 27.314l79.981 80.002c6.245 6.245 16.38 6.247 22.627 0l79.984-80.002c10.05-10.05 2.928-27.314-11.313-27.314z"></path>
  </symbol>
  <symbol id="sort-numeric-up" viewBox="0 0 448 512">
    <title id="sort-numeric-up-title">Sort Numeric Up</title>
    <path d="M308.811 113.787l-19.448-20.795c-4.522-4.836-4.274-12.421.556-16.95l43.443-40.741a11.999 11.999 0 0 1 8.209-3.247h31.591c6.627 0 12 5.373 12 12v127.07h25.66c6.627 0 12 5.373 12 12v28.93c0 6.627-5.373 12-12 12H301.649c-6.627 0-12-5.373-12-12v-28.93c0-6.627 5.373-12 12-12h25.414v-57.938c-7.254 6.58-14.211 4.921-18.252.601zm-30.57 238.569c0-32.653 23.865-67.356 68.094-67.356 38.253 0 79.424 28.861 79.424 92.228 0 51.276-32.237 105.772-91.983 105.772-17.836 0-30.546-3.557-38.548-6.781-5.79-2.333-8.789-8.746-6.922-14.703l9.237-29.48c2.035-6.496 9.049-9.983 15.467-7.716 13.029 4.602 27.878 5.275 38.103-4.138-38.742 5.072-72.872-25.36-72.872-67.826zm92.273 19.338c0-22.285-15.302-36.505-25.835-36.505-8.642 0-13.164 7.965-13.164 15.832 0 5.669 1.815 24.168 25.168 24.168 9.973 0 13.377-2.154 13.744-2.731.021-.046.087-.291.087-.764zM16.016 144H64v320c0 8.837 7.163 16 16 16h32c8.837 0 16-7.163 16-16V144h47.981c14.212 0 21.384-17.244 11.314-27.314l-79.981-80.002c-6.245-6.245-16.38-6.247-22.627 0L4.702 116.686C-5.347 126.736 1.775 144 16.016 144z"></path>
  </symbol>
  <symbol id="sort-up" viewBox="0 0 320 512">
    <title id="sort-up-title">Sort Up (Ascending)</title>
    <path d="M279 224H41c-21.4 0-32.1-25.9-17-41L143 64c9.4-9.4 24.6-9.4 33.9 0l119 119c15.2 15.1 4.5 41-16.9 41z"></path>
  </symbol>
  <symbol id="spinner" viewBox="0 0 512 512">
    <title id="spinner-title">Spinner</title>
    <path d="M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z"></path>
  </symbol>
  <symbol id="star" viewBox="0 0 576 512">
    <title id="star-title">Star</title>
    <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path>
  </symbol>
  <symbol id="step-backward" viewBox="0 0 448 512">
    <title id="step-backward-title">step-backward</title>
    <path d="M64 468V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12v176.4l195.5-181C352.1 22.3 384 36.6 384 64v384c0 27.4-31.9 41.7-52.5 24.6L136 292.7V468c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12z"></path>
  </symbol>
  <symbol id="step-forward" viewBox="0 0 448 512">
    <title id="step-forward-title">step-forward</title>
    <path d="M384 44v424c0 6.6-5.4 12-12 12h-48c-6.6 0-12-5.4-12-12V291.6l-195.5 181C95.9 489.7 64 475.4 64 448V64c0-27.4 31.9-41.7 52.5-24.6L312 219.3V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12z"></path>
  </symbol>
  <symbol id="sync" viewBox="0 0 512.333 512">
    <title id="sync-title">Sync</title>
    <path d="M440.935 12.574l3.966 82.766C399.416 41.904 331.674 8 256 8 134.813 8 33.933 94.924 12.296 209.824 10.908 217.193 16.604 224 24.103 224h49.084c5.57 0 10.377-3.842 11.676-9.259C103.407 137.408 172.931 80 256 80c60.893 0 114.512 30.856 146.104 77.801l-101.53-4.865c-6.845-.328-12.574 5.133-12.574 11.986v47.411c0 6.627 5.373 12 12 12h200.333c6.627 0 12-5.373 12-12V12c0-6.627-5.373-12-12-12h-47.411c-6.853 0-12.315 5.729-11.987 12.574zM256 432c-60.895 0-114.517-30.858-146.109-77.805l101.868 4.871c6.845.327 12.573-5.134 12.573-11.986v-47.412c0-6.627-5.373-12-12-12H12c-6.627 0-12 5.373-12 12V500c0 6.627 5.373 12 12 12h47.385c6.863 0 12.328-5.745 11.985-12.599l-4.129-82.575C112.725 470.166 180.405 504 256 504c121.187 0 222.067-86.924 243.704-201.824 1.388-7.369-4.308-14.176-11.807-14.176h-49.084c-5.57 0-10.377 3.842-11.676 9.259C408.593 374.592 339.069 432 256 432z"></path>
  </symbol>
  <symbol id="tag" viewBox="0 0 512 512">
    <title id="tag-title">tag</title>
    <path d="M0 252.118V48C0 21.49 21.49 0 48 0h204.118a48 48 0 0 1 33.941 14.059l211.882 211.882c18.745 18.745 18.745 49.137 0 67.882L293.823 497.941c-18.745 18.745-49.137 18.745-67.882 0L14.059 286.059A48 48 0 0 1 0 252.118zM112 64c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48z"></path>
  </symbol>
  <symbol id="tags" viewBox="0 0 640 512">
    <title id="tags-title">tags</title>
    <path d="M497.941 225.941L286.059 14.059A48 48 0 0 0 252.118 0H48C21.49 0 0 21.49 0 48v204.118a48 48 0 0 0 14.059 33.941l211.882 211.882c18.744 18.745 49.136 18.746 67.882 0l204.118-204.118c18.745-18.745 18.745-49.137 0-67.882zM112 160c-26.51 0-48-21.49-48-48s21.49-48 48-48 48 21.49 48 48-21.49 48-48 48zm513.941 133.823L421.823 497.941c-18.745 18.745-49.137 18.745-67.882 0l-.36-.36L527.64 323.522c16.999-16.999 26.36-39.6 26.36-63.64s-9.362-46.641-26.36-63.64L331.397 0h48.721a48 48 0 0 1 33.941 14.059l211.882 211.882c18.745 18.745 18.745 49.137 0 67.882z"></path>
  </symbol>
  <symbol id="times" viewBox="0 0 384 512">
    <title id="times-title">Times</title>
    <path d="M323.1 441l53.9-53.9c9.4-9.4 9.4-24.5 0-33.9L279.8 256l97.2-97.2c9.4-9.4 9.4-24.5 0-33.9L323.1 71c-9.4-9.4-24.5-9.4-33.9 0L192 168.2 94.8 71c-9.4-9.4-24.5-9.4-33.9 0L7 124.9c-9.4 9.4-9.4 24.5 0 33.9l97.2 97.2L7 353.2c-9.4 9.4-9.4 24.5 0 33.9L60.9 441c9.4 9.4 24.5 9.4 33.9 0l97.2-97.2 97.2 97.2c9.3 9.3 24.5 9.3 33.9 0z"></path>
  </symbol>
  <symbol id="times-circle" viewBox="0 0 512 512">
    <title id="times-circle-title">Times Circle</title>
    <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338 377.6c-4.7 4.7-12.3 4.7-17 0L256 312l-65.1 65.6c-4.7 4.7-12.3 4.7-17 0L134.4 338c-4.7-4.7-4.7-12.3 0-17l65.6-65-65.6-65.1c-4.7-4.7-4.7-12.3 0-17l39.6-39.6c4.7-4.7 12.3-4.7 17 0l65 65.7 65.1-65.6c4.7-4.7 12.3-4.7 17 0l39.6 39.6c4.7 4.7 4.7 12.3 0 17L312 256l65.6 65.1z"></path>
  </symbol>
  <symbol id="trash" viewBox="0 0 448 512">
    <title id="trash-title">Trash</title>
    <path d="M0 84V56c0-13.3 10.7-24 24-24h112l9.4-18.7c4-8.2 12.3-13.3 21.4-13.3h114.3c9.1 0 17.4 5.1 21.5 13.3L312 32h112c13.3 0 24 10.7 24 24v28c0 6.6-5.4 12-12 12H12C5.4 96 0 90.6 0 84zm415.2 56.7L394.8 467c-1.6 25.3-22.6 45-47.9 45H101.1c-25.3 0-46.3-19.7-47.9-45L32.8 140.7c-.4-6.9 5.1-12.7 12-12.7h358.5c6.8 0 12.3 5.8 11.9 12.7z"></path>
  </symbol>
  <symbol id="triangle" viewBox="0 0 576 512">
    <title id="triangle-title">Triangle</title>
    <path d="M329.6 24c-18.4-32-64.7-32-83.2 0L6.5 440c-18.4 31.9 4.6 72 41.6 72H528c36.9 0 60-40 41.6-72l-240-416z"></path>
  </symbol>
  <symbol id="upload" viewBox="0 0 512 512">
    <title id="upload-title">Upload</title>
    <path d="M296 384h-80c-13.3 0-24-10.7-24-24V192h-87.7c-17.8 0-26.7-21.5-14.1-34.1L242.3 5.7c7.5-7.5 19.8-7.5 27.3 0l152.2 152.2c12.6 12.6 3.7 34.1-14.1 34.1H320v168c0 13.3-10.7 24-24 24zm216-8v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h136v8c0 30.9 25.1 56 56 56h80c30.9 0 56-25.1 56-56v-8h136c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"></path>
  </symbol>
  <symbol id="user" viewBox="0 0 512 512">
    <title id="user-title">User</title>
    <path d="M96 160C96 71.634 167.635 0 256 0s160 71.634 160 160-71.635 160-160 160S96 248.366 96 160zm304 192h-28.556c-71.006 42.713-159.912 42.695-230.888 0H112C50.144 352 0 402.144 0 464v24c0 13.255 10.745 24 24 24h464c13.255 0 24-10.745 24-24v-24c0-61.856-50.144-112-112-112z"></path>
  </symbol>
  <symbol id="user-circle" viewBox="0 0 512 512">
    <title id="user-circle-title">User Circle</title>
    <path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zM144 208c0-61.856 50.144-112 112-112s112 50.144 112 112-50.144 112-112 112-112-50.144-112-112zm268.408 172.663c-80.346 100.411-232.375 100.53-312.817 0C117.003 362.973 141.218 352 168 352h18.204c44.03 21.336 95.495 21.368 139.592 0H344c26.782 0 50.997 10.973 68.408 28.663z"></path>
  </symbol>
  <symbol id="user-plus" viewBox="0 0 640 512">
    <title id="user-plus-title">Add User</title>
    <path d="M616 332c0-6.627-5.373-12-12-12h-60v-60c0-6.627-5.373-12-12-12h-40c-6.627 0-12 5.373-12 12v60h-60c-6.627 0-12 5.373-12 12v40c0 6.627 5.373 12 12 12h60v60c0 6.627 5.373 12 12 12h40c6.627 0 12-5.373 12-12v-60h60c6.627 0 12-5.373 12-12v-40zM448 444v15c0 11.598-9.402 21-21 21H21c-11.598 0-21-9.402-21-21v-21c0-54.124 43.876-98 98-98h24.986c62.104 37.358 139.897 37.374 202.027 0H350a98.09 98.09 0 0 1 26 3.493V372c0 24.262 19.738 44 44 44h25.519c2.768 12.064 2.481 20.659 2.481 28zM84 172c0-77.32 62.68-140 140-140s140 62.68 140 140-62.68 140-140 140S84 249.32 84 172z"></path>
  </symbol>
  <symbol id="user-times" viewBox="0 0 640 512">
    <title id="user-times-title">Remove User</title>
    <path d="M599.681 411.397c4.686-4.686 4.686-12.284 0-16.971L557.255 352l42.426-42.426c4.686-4.686 4.686-12.284 0-16.971l-28.284-28.284c-4.686-4.686-12.284-4.686-16.971 0L512 306.745l-42.426-42.426c-4.686-4.686-12.284-4.686-16.971 0l-28.284 28.284c-4.686 4.686-4.686 12.284 0 16.971L466.745 352l-42.426 42.426c-4.686 4.686-4.686 12.284 0 16.971l28.284 28.284c4.686 4.686 12.284 4.686 16.971 0L512 397.255l42.426 42.426c4.686 4.686 12.284 4.686 16.971 0l28.284-28.284zM84 172c0-77.32 62.68-140 140-140s140 62.68 140 140-62.68 140-140 140S84 249.32 84 172zm359.737 299.645C439.904 476.712 433.843 480 427 480H21c-11.598 0-21-9.402-21-21v-21c0-54.124 43.876-98 98-98h24.986c62.104 37.358 139.897 37.374 202.027 0H350c23.366 0 44.818 8.183 61.658 21.832l-9.967 9.967c-17.156 17.156-17.156 45.07 0 62.225l28.284 28.284a43.946 43.946 0 0 0 13.762 9.337z"></path>
  </symbol>
  <symbol id="users" viewBox="0 0 640 512">
    <title id="users-title">Users</title>
    <path d="M220 164c0-55.229 44.772-100 100-100s100 44.771 100 100-44.772 100-100 100-100-44.771-100-100zM48 208c0-44.183 35.817-80 80-80s80 35.817 80 80-35.817 80-80 80-80-35.817-80-80zm384 0c0-44.183 35.817-80 80-80s80 35.817 80 80-35.817 80-80 80-80-35.817-80-80zm-22 76c38.66 0 70 31.34 70 70v70c0 13.255-10.745 24-24 24H184c-13.255 0-24-10.745-24-24v-70c0-38.66 31.34-70 70-70h17.848c44.364 26.687 99.93 26.693 144.305 0H410m-282 70c0-11.975 2.081-23.472 5.889-34.156-21.93 1.152-44.122-4.121-63.611-15.844H56c-30.928 0-56 25.072-56 56v32c0 13.255 10.745 24 24 24h104v-62zm456-50h-14.278c-19.495 11.727-41.686 16.996-63.611 15.844A101.542 101.542 0 0 1 512 354v62h104c13.255 0 24-10.745 24-24v-32c0-30.928-25.072-56-56-56z"></path>
  </symbol>
  <symbol id="watch" viewBox="0 0 384 512">
    <title id="watch-title">Watch</title>
    <path d="M192 80c97.2 0 176 78.8 176 176s-78.8 176-176 176S16 353.2 16 256 94.8 80 192 80m0-24c47.4 0 92.4 16.6 128 46.3V24c0-13.3-10.7-24-24-24H88C74.7 0 64 10.7 64 24v78.3C99.6 72.6 144.5 56 192 56zm0 400c-47.5 0-92.4-16.7-128-46.3V488c0 13.3 10.7 24 24 24h208c13.3 0 24-10.7 24-24v-78.3c-35.6 29.7-80.6 46.3-128 46.3zm53-130.3l18.8-25.9c3.9-5.4 2.7-12.9-2.6-16.8L220 253v-93c0-6.6-5.4-12-12-12h-32c-6.6 0-12 5.4-12 12v115.4c0 3.8 1.8 7.4 4.9 9.7l59.3 43.2c5.4 4 12.9 2.8 16.8-2.6z"></path>
  </symbol>
</svg>

