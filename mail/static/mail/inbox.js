document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Show single email view
  document.addEventListener('click', event => {
    const box = event.target.closest('.email-box');
    if (box) {
      //console.log(box.dataset.id)
      load_email(box.dataset.id);
    }
  });

  document.querySelector('#compose-input').addEventListener('click', () => {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
      .then(response => response.json())
      .then(result => {
        // Print result
        if (result.error) {
          let errorMessage = document.querySelector('#error');
          errorMessage.innerHTML = result.error;
        } else {
          load_mailbox('sent');
        }
        console.log(result);
      });
  })

  document.querySelector('#reply').addEventListener('click', () => {
      const email_view = document.querySelector('#email-view');
      //js object
      const email = {
        sender: email_view.dataset.sender,
        subject: email_view.dataset.subject,
        body: email_view.dataset.body,
        timestamp: email_view.dataset.timestamp
      }
      reply(email);
    });

});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  // Enable fields
  document.querySelector('#compose-recipients').disabled = false;
  document.querySelector('#compose-subject').disabled = false;
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#error').innerText = '';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // insert emails into mailbox
  fetch(`/emails/${mailbox}`).then(response => response.json()).then(emails => {
    emails.forEach(email => {
      console.log(email);
      const email_div = document.createElement('div');
      if (email.read) {
        email_div.className = 'email-box';
      } else {
        email_div.className = 'email-box unread';
      }
      email_div.dataset.id = email.id;
      email_div.innerHTML = `
      <h6>${email.sender}</h6>
      <p>${email.subject}</p>
      <p>${email.timestamp}</p>
      `;
      const archive_btn = document.createElement("button");
      archive_btn.className = 'btn btn-outline-warning'
      if (mailbox === 'inbox') {
        archive_btn.innerText = "Archive";
        archive_btn.addEventListener('click', (event) => {
          event.stopPropagation();
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: true
            })
          });
          removeDiv(archive_btn);
        });
      } else if (mailbox === 'archive') {
        archive_btn.innerText = "Remove";
        archive_btn.addEventListener('click', (event) => {
          event.stopPropagation();
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: false
            })
          });
          removeDiv(archive_btn);
        });
      } else {
        archive_btn.style.display = 'none'
      }
      email_div.append(archive_btn);
      document.querySelector('#emails-view').append(email_div);
    });
  })
}

function load_email(id) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#error').innerText = '';

  fetch(`/emails/${id}`).then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        throw new Error(err.error || "Unknown error");
      });
    }
    return response.json()
  }).then(email => {
    console.log(email);
    const email_view = document.querySelector('#email-view');
    email_view.dataset.sender = email.sender;
    email_view.dataset.subject = email.subject;
    email_view.dataset.timestamp = email.timestamp;
    email_view.dataset.body = email.body;

    document.querySelector('#email-sender').innerHTML = `<strong>From: </strong> ${email.sender}`;
    document.querySelector('#email-recipients').innerHTML = `<strong>To: </strong> ${email.recipients}`;
    document.querySelector('#email-subject').innerHTML = `<strong>Subject: </strong> ${email.subject}`;
    document.querySelector('#email-timestamp').innerHTML = `<strong>Timestamp: </strong> ${email.timestamp}`;
    document.querySelector('#email-body').innerHTML = email.body;
    
    //mark email as read
    if (!email.read) {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      });
    }
  }).catch(error => {
    console.error("Fetch error:", error);
    document.querySelector('#error').innerText = error.message;
  });
}

function removeDiv(element) {
  element.parentElement.style.animationPlayState = 'running';
  element.parentElement.addEventListener('animationend', () => {
    element.parentElement.remove();
  })
}

function reply(email) {
  compose_email();
  const recipient = document.querySelector('#compose-recipients');
  recipient.value = email.sender;
  recipient.disabled = true;
  const subject = document.querySelector('#compose-subject');
  //check if the subject already starts with "Re:"
  console.log(email.subject.substring(0, 3) === 'Re:');
  if (!(email.subject.substring(0, 3) === 'Re:')) {
    subject.value = `Re: ${email.subject}`;
  }
  subject.disabled = true;
  document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}\n`
}