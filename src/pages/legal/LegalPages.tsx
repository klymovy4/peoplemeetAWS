import {Link} from "react-router-dom";
import classes from './legal.module.css';

// Public pages linked from the mobile app and the store listings
export const SUPPORT_EMAIL = 'klymovy4roman@gmail.com';
const LAST_UPDATED = 'October 30, 2026';
// Data controller: individual developer based in Italy (GDPR applies)
const OPERATOR = 'Roman Klymovych, an individual developer based in Italy';

const LegalNav = () => (
    <nav className={classes.nav}>
       <Link to="/privacy">Privacy Policy</Link>
       <Link to="/terms">Terms of Use</Link>
       <Link to="/delete-account">Delete your account</Link>
       <Link to="/login">PeopleMeet</Link>
    </nav>
);

const Email = () => <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;

export const PrivacyPolicy = () => (
    <div className={classes.page}>
       <h1>Privacy Policy</h1>
       <p className={classes.updated}>Last updated: {LAST_UPDATED}</p>

       <p>
          PeopleMeet ("we", "the app") helps people see who is nearby and chat with them. This policy explains
          what data we collect, why, who can see it and how long we keep it. PeopleMeet is operated by {OPERATOR}.
          Contact: <Email/>.
       </p>

       <h2>1. Data we collect</h2>
       <ul>
          <li><b>Account:</b> email address and password. Passwords are stored only as a secure hash.</li>
          <li><b>Profile:</b> name, age, gender, description, a short status ("thoughts") and a profile photo.</li>
          <li><b>Location:</b> your device position, only while you have turned "online" on and the app is open.
             We do not collect your location in the background.</li>
          <li><b>Messages:</b> the chat messages you send and receive.</li>
          <li><b>Safety data:</b> users you block, reports you send, reports made about you (including a copy of a
             reported message).</li>
          <li><b>Technical data:</b> login session tokens, online status and the time you were last online,
             and standard server logs (such as IP address) used to run and protect the service.</li>
       </ul>
       <p>We do not use advertising, analytics or tracking tools, and we do not sell your data.</p>

       <h2>2. Why we use it</h2>
       <ul>
          <li>To create and secure your account (including password recovery by email).</li>
          <li>To show your profile and position on the map to other users while you are online.</li>
          <li>To deliver messages between users.</li>
          <li>To keep the community safe: handle reports, blocks and bans.</li>
       </ul>
       <p>
          We process this data to provide the service you asked for (contract), to keep the service safe
          (legitimate interest) and, for location, based on your consent, which you can withdraw at any time by
          going offline or turning off location access in your device settings.
       </p>

       <h2>3. Who can see your data</h2>
       <ul>
          <li><b>Other users</b> see your name, age, gender, description, thoughts and photo. While you are online,
             they also see your <b>approximate</b> position on the map: it is shifted by 50-150 m in a random
             direction (the shift stays the same while you are online, so it can't be averaged out), and your exact
             position never leaves our server. When you go offline (or after 3 minutes without activity) your
             position is removed.</li>
          <li><b>Your chat partner</b> sees the messages you exchange.</li>
          <li><b>Blocking:</b> you and the user you block no longer see each other on the map and can't message
             each other. The conversation disappears for you; the blocked user keeps the old messages (until they
             are deleted automatically) so they can still report them.</li>
          <li><b>Reported users are not told who reported them.</b></li>
          <li><b>Service providers</b> that run parts of the service for us: Amazon Web Services (server hosting),
             Cloudflare (network and security), Twilio SendGrid (sending emails), and map providers that display
             the map (Apple Maps on iPhone, Google Maps on Android). They only process data needed for their task.</li>
          <li>Authorities, only when required by law.</li>
       </ul>

       <h2>4. How long we keep it</h2>
       <ul>
          <li>Chat messages are deleted automatically after 12 hours. Deleting a conversation hides it for you; the
             other person keeps their copy until it is deleted automatically. If you delete one of your messages
             "for everyone", both of you see "Message deleted", but its text is kept until the automatic deletion
             so it can be reviewed if the conversation is reported.</li>
          <li>Your location is kept only while you are online.</li>
          <li>Password recovery codes expire after 15 minutes; login sessions after 7 days.</li>
          <li>Profile data is kept until you delete your account.</li>
          <li>Reports about a user, including the copy of a reported message, are kept as moderation history to
             protect other users, even after the reported account is deleted.</li>
       </ul>

       <h2>5. Your rights</h2>
       <p>
          You can view and edit your profile in the app, go offline at any time, and delete your account in the app
          (Profile → Delete account). Deleting your account removes your profile, photo, messages, blocks, sessions
          and the reports you sent. See <Link to="/delete-account">Delete your account</Link>.
          You can also ask us for a copy of your data, correction or deletion, or object to processing, by writing
          to <Email/>. You also have the right to lodge a complaint with a data protection authority: in Italy, the Garante per la
          protezione dei dati personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noreferrer">garanteprivacy.it</a>),
          or the authority of the EU/EEA country where you live.
       </p>

       <h2>6. Age</h2>
       <p>PeopleMeet is only for people aged 18 and over. We delete accounts of users we find to be under 18.</p>

       <h2>7. Security</h2>
       <p>
          We use encrypted connections (HTTPS), store passwords as hashes and limit password recovery attempts.
          No system is perfectly secure, so please use a unique password.
       </p>

       <h2>8. Changes</h2>
       <p>We may update this policy. We will change the date above and, for important changes, notify you in the app.</p>

       <h2>9. Contact</h2>
       <p>Questions or requests: <Email/>.</p>

       <LegalNav/>
    </div>
);

export const TermsOfUse = () => (
    <div className={classes.page}>
       <h1>Terms of Use and Community Rules</h1>
       <p className={classes.updated}>Last updated: {LAST_UPDATED}</p>

       <p>
          By creating an account or using PeopleMeet you agree to these terms. PeopleMeet is operated by {OPERATOR}.
          If you do not agree, do not use the app.
       </p>

       <h2>1. Who can use PeopleMeet</h2>
       <ul>
          <li>You must be at least 18 years old.</li>
          <li>You must give true information about yourself and use only your own photos.</li>
          <li>You are responsible for keeping your password safe and for everything done with your account.</li>
       </ul>

       <h2>2. Community rules - zero tolerance</h2>
       <p>We have zero tolerance for objectionable content and abusive users. You must not:</p>
       <ul>
          <li>harass, threaten, bully, stalk or insult other people;</li>
          <li>post hate speech or discriminate against anyone;</li>
          <li>post nudity, sexual content or violent content;</li>
          <li>send spam, advertising, scams or requests for money;</li>
          <li>pretend to be someone else or create fake profiles;</li>
          <li>share other people's personal information without their consent;</li>
          <li>use the app if you are under 18, or contact minors;</li>
          <li>do anything illegal, or try to break, overload or misuse the service.</li>
       </ul>

       <h2>3. Reporting, blocking and moderation</h2>
       <ul>
          <li>You can block any user and report users or messages from their profile or chat. Reporting a user
             also blocks them.</li>
          <li>We review reports within 24 hours and may remove content, limit or permanently ban accounts that break
             these rules, without prior notice.</li>
          <li>If you believe your account was banned by mistake, write to <Email/>.</li>
       </ul>

       <h2>4. Meeting people safely</h2>
       <p>
          PeopleMeet does not check users' identities or backgrounds. Be careful: meet in public places, tell a friend
          where you are going, do not send money, and report suspicious behaviour. You are responsible for your
          interactions with other users.
       </p>

       <h2>5. Your content</h2>
       <p>
          You keep the rights to your photos and texts. You allow us to store and show them to other users so the
          service can work. You confirm you have the right to post them.
       </p>

       <h2>6. Ending your account</h2>
       <p>
          You can delete your account at any time in the app (Profile → Delete account). We may suspend or close
          accounts that break these terms.
       </p>

       <h2>7. Disclaimer</h2>
       <p>
          The app is provided "as is". We do our best to keep it working and safe but cannot guarantee it will always
          be available or error-free, and we are not responsible for the behaviour of users, online or offline, to
          the extent permitted by law.
       </p>

       <h2>8. Changes</h2>
       <p>We may update these terms. Continuing to use the app after a change means you accept the new terms.</p>

       <h2>9. Contact</h2>
       <p><Email/></p>

       <LegalNav/>
    </div>
);

export const DeleteAccountInfo = () => (
    <div className={classes.page}>
       <h1>Delete your PeopleMeet account</h1>
       <p className={classes.updated}>Last updated: {LAST_UPDATED}</p>

       <h2>In the app</h2>
       <ol>
          <li>Open PeopleMeet and log in.</li>
          <li>Go to <b>Profile</b> and tap <b>Delete account</b> at the bottom.</li>
          <li>Enter your password and confirm. The account is deleted immediately.</li>
       </ol>

       <h2>Without the app</h2>
       <p>
          Write to <Email/> from the email address of your account with the subject "Delete my account".
          We will delete it within 30 days and confirm by email.
       </p>

       <h2>What is deleted</h2>
       <ul>
          <li>Your profile: name, age, gender, description, thoughts and photo.</li>
          <li>Your location and online status.</li>
          <li>All your conversations (for both participants).</li>
          <li>Your blocks, login sessions and the reports you sent.</li>
       </ul>

       <h2>What is kept</h2>
       <p>
          Reports other users made about your account (including a copy of a reported message) are kept as moderation
          history to protect the community. Accounts banned for breaking the rules can't be deleted by the user, so
          the ban can't be bypassed by registering again.
       </p>
       <p>After deletion you can register again with the same email.</p>

       <LegalNav/>
    </div>
);
