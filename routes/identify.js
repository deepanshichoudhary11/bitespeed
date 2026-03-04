const express = require("express");
const router = express.Router();
const Contact = require("../models/contact");
const { Op } = require("sequelize");

router.post("/", async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: "Email or phoneNumber required" });
    }

    // 1️⃣ Find all contacts matching email OR phone
    const matchedContacts = await Contact.findAll({
      where: {
        deletedAt: null,
        [Op.or]: [
          email ? { email } : null,
          phoneNumber ? { phoneNumber } : null
        ].filter(Boolean)
      }
    });

    // 2️⃣ If no match → create new primary
    if (matchedContacts.length === 0) {
      const newContact = await Contact.create({
        email,
        phoneNumber,
        linkPrecedence: "primary"
      });

      return res.json({
        contact: {
          primaryContactId: newContact.id,
          emails: email ? [email] : [],
          phoneNumbers: phoneNumber ? [phoneNumber] : [],
          secondaryContactIds: []
        }
      });
    }

    // 3️⃣ Get all related contact IDs (including linked ones)
    let allContactIds = new Set();

    for (let contact of matchedContacts) {
      if (contact.linkPrecedence === "primary") {
        allContactIds.add(contact.id);
      } else {
        allContactIds.add(contact.linkedId);
      }
    }

    // Fetch all contacts under those primary IDs
    const allRelatedContacts = await Contact.findAll({
      where: {
        deletedAt: null,
        [Op.or]: [
          { id: Array.from(allContactIds) },
          { linkedId: Array.from(allContactIds) }
        ]
      }
    });

    // 4️⃣ Determine oldest primary
    const primaryCandidates = allRelatedContacts.filter(
      c => c.linkPrecedence === "primary"
    );

    primaryCandidates.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const oldestPrimary = primaryCandidates[0];

    // 5️⃣ Convert other primaries to secondary
    for (let contact of primaryCandidates) {
      if (contact.id !== oldestPrimary.id) {
        await contact.update({
          linkPrecedence: "secondary",
          linkedId: oldestPrimary.id
        });
      }
    }

    // 6️⃣ Create new secondary if new info
    const emails = new Set(allRelatedContacts.map(c => c.email).filter(Boolean));
    const phones = new Set(allRelatedContacts.map(c => c.phoneNumber).filter(Boolean));

    if ((email && !emails.has(email)) || (phoneNumber && !phones.has(phoneNumber))) {
      await Contact.create({
        email,
        phoneNumber,
        linkedId: oldestPrimary.id,
        linkPrecedence: "secondary"
      });
    }

    // 7️⃣ Fetch final merged contacts
    const finalContacts = await Contact.findAll({
      where: {
        deletedAt: null,
        [Op.or]: [
          { id: oldestPrimary.id },
          { linkedId: oldestPrimary.id }
        ]
      }
    });

    const finalEmails = [
      oldestPrimary.email,
      ...finalContacts
        .filter(c => c.linkPrecedence === "secondary")
        .map(c => c.email)
    ].filter(Boolean);

    const finalPhones = [
      oldestPrimary.phoneNumber,
      ...finalContacts
        .filter(c => c.linkPrecedence === "secondary")
        .map(c => c.phoneNumber)
    ].filter(Boolean);

    const secondaryIds = finalContacts
      .filter(c => c.linkPrecedence === "secondary")
      .map(c => c.id);

    return res.json({
      contact: {
        primaryContactId: oldestPrimary.id,
        emails: [...new Set(finalEmails)],
        phoneNumbers: [...new Set(finalPhones)],
        secondaryContactIds: secondaryIds
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;