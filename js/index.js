/**
 * Return an HTML formated string corresponding to Bootsrap card.
 * @param {String} cardHeader - Header content of the card.
 * @param {String} cardBody - Body content of the card.
 */
const genericCard = (cardHeader, cardBody) =>
  `<div class="card"><div class="card-header">${cardHeader}</div><div class="card-body">${cardBody}</div></div>`;
/**
 * Return an HTML formated string from a {@link genericCard} with the headet set
 * as Result.
 * @param {String} result - Result in the body card.
 */
const resultCard = (result) => genericCard("Result", result);
/**
 * Class describing an success alert message for a div or in a card.
 */
class successMessage {
  static CLASS = "alert-success";
  static TITLE = "Success";
}
/**
 * Class describing an error alert message for a div or in a card.
 */
class errorMessage {
  static CLASS = "alert-danger";
  static TITLE = "Error";
}
/**
 * Class describing modal to show when multiple files are dropped.
 * @extends {errorMessage} - To get CLASS and TITLE STATICS.
 */
class tooManyFilesModalContent extends errorMessage {
  static MESSAGE = "Drag only one file";
}
/**
 * Class describing modal to show when reading dropped file failed.
 * @extends {errorMessage} - To get CLASS and TITLE STATICS.
 */
class readingFileError extends errorMessage {
  static MESSAGE = "Fail to read dragged file";
}
/**
 * Modal to show for any type of messages to access HTML native methods.
 */
var messageModal = document.getElementById("message-modal");
/**
 * Bootstrap modal to show for any type of messages to access bs specific
 * methods.
 */
var bsMessageModal = new bootstrap.Modal(
  document.getElementById("message-modal"),
  {
    keyboard: true,
  }
);
/**
 * Return an HTML formated string corresponding to Bootstrap alert div.
 * @param {String} tagClass - Complete the alert class of the alert div.
 * @param {String} message - Message to alert the div.
 */
const bsAlertElement = (tagClass, message) =>
  `<div class="alert ${tagClass}" role="alert">${message}</div>`;
/**
 * Configure the modal with a Bootstrap card contained an alert div in the body.
 * Calling this function show the modal.
 * @param {String} tagClass - Complete the alert class of the alert div.
 * @param {String} title - Message to alert the div.
 * @param {String} message - Message to alert the div.
 */
const showMessageModalParameter = (tagClass, title, message) => {
  messageModal.querySelector(".modal-title").innerHTML = title;
  messageModal.querySelector(".modal-body").innerHTML = bsAlertElement(
    tagClass,
    message
  );
  bsMessageModal.show();
};
/**
 * Call {@link showMessageModalParameter} based on an object with the
 * required properties and threfore show the modal.
 * @param {any} modalContent - Any object containing CLASS, TITLE and MESSAGE
 * properties.
 */
const showMessageModal = (modalContent) => {
  showMessageModalParameter(
    modalContent.CLASS,
    modalContent.TITLE,
    modalContent.MESSAGE
  );
};
var cbor1 = null; // CBOR decoded object of the file on the left
var cbor2 = null; // CBOR decoded object of the file on the right

var fileReader = new FileReader(); // Unique read of all files
/**
 * Function called when the file is dropped.
 * @param {Event} ev - Dropping event.
 * @param {String} id - id of the where the file was dropped.
 */
function dropHandler(ev, id) {
  console.debug(`File dropped in ${id}`);

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
  var file = null;
  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    if (ev.dataTransfer.items.length > 1) {
      return showMessageModal(tooManyFilesModalContent);
    } else {
      // If dropped items aren't files, reject them
      if (ev.dataTransfer.items[0].kind === "file") {
        file = ev.dataTransfer.items[0].getAsFile();
      }
    }
  } else {
    if (ev.dataTransfer.items.files > 1) {
      return showMessageModal(tooManyFilesModalContent);
    } else {
      // Use DataTransfer interface to access the file(s)
      file = ev.dataTransfer.files[0];
    }
  }

  fileReader.readAsArrayBuffer(file); // fileReader.result -> ArrayBuffer.
  /*****************************************************************************
   * Executed when the file is dropped
   */
  fileReader.onload = function () {
    try {
      CBORdecoded = CBOR.decode(fileReader.result);
    } catch (error) {
      return showMessageModalParameter(
        errorMessage.CLASS,
        errorMessage.TITLE,
        `Error while trying to decode the CBOR file: ${error}`
      );
    }
    /***************************************************************************
     * Create a card with the filename as header and stringify JSON in body.
     */
    document.getElementById(id).innerHTML = genericCard(
      file.name,
      `<pre><code>${JSON.stringify(CBORdecoded, undefined, 4)}</pre></code>`
    );
    /***************************************************************************
     * Update the cbor1 or cbor2 variables depending of the id manipulated.
     */
    if (id === "cbor-content-1") {
      cbor1 = CBORdecoded;
    } else if (id === "cbor-content-2") {
      cbor2 = CBORdecoded;
    } else {
      throw new Error("Unknown tag id.");
    }
    /***************************************************************************
     * Display a result card only if CBOR a known.
     */
    if (cbor1 != null && cbor2 != null) {
      if (
        // Identical CBORS
        Object.keys(cbor1).every((key) => Object.keys(cbor2).includes(key)) &&
        Object.keys(cbor2).every((key) => Object.keys(cbor1).includes(key))
      ) {
        document.getElementById("result").innerHTML = resultCard(
          bsAlertElement(
            successMessage.CLASS,
            "All keys of the two CBOR files are identical."
          )
        );
      } else if (
        // Right side CBOR more complete
        Object.keys(cbor1).every((key) => Object.keys(cbor2).includes(key))
      ) {
        document.getElementById("result").innerHTML = resultCard(
          bsAlertElement(
            errorMessage.CLASS,
            `Right side CBOR file contained extra key(s): ${Object.keys(
              cbor2
            ).filter((x) => !Object.keys(cbor1).includes(x))}.`
          )
        );
      } else if (
        // left side CBOR more complete
        Object.keys(cbor2).every((key) => Object.keys(cbor1).includes(key))
      ) {
        document.getElementById("result").innerHTML = resultCard(
          bsAlertElement(
            errorMessage.CLASS,
            `Left side CBOR file contained extra key(s): ${Object.keys(
              cbor1
            ).filter((x) => !Object.keys(cbor2).includes(x))}.`
          )
        );
      } else {
        // No key in common
        document.getElementById("result").innerHTML = resultCard(
          bsAlertElement(
            errorMessage.CLASS,
            "None of the keys of both CBOR files are identical."
          )
        );
      }
    }
  };
  /*****************************************************************************
   * Executed if an error occured while reading.
   */
  fileReader.onerror = function () {
    return showMessageModal(readingFileError);
  };
}
/**
 * Function called when the file is dragged.
 * @param {Event} ev - Dragging event.
 * @param {String} id - id of the where the file was dropped.
 */
function dragOverHandler(ev, id) {
  console.debug(`File in drop zone in ${id}`);

  // Prevent default behavior (Prevent file from being opened)
  ev.stopPropagation();
  ev.preventDefault();
  // Explicitly show this is a copy.
  ev.dataTransfer.dropEffect = "copy";
}
