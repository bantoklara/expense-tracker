import admin from '../firebase.js'; 
import Expense from "../models/ExpenseModel.js";

const db = admin.firestore(); 

export const createExpense = async (req, res, _next) => {
    try {
        const data = req.body;
        data.date = data.date ? new Date(data.date) : new Date();

        const docRef = await db.collection('expenses').add(data);
        const docSnap = await docRef.get();

        res.status(200).send(new Expense(
            docSnap.id,
            docSnap.data().amount,
            docSnap.data().category,
            docSnap.data().date
        ));
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getExpenses = async (req, res, _next) => {
    try {
        const dataLimit = req.query.limit ? parseInt(req.query.limit) : null;
        let lastDate = req.query.lastDate ? JSON.parse(req.query.lastDate) : null;
        let lastId = req.query.lastId ? req.query.lastId : null;

        let qry = db.collection('expenses')
            .orderBy('date', 'desc')
            .orderBy('__name__')
            .limit(dataLimit + 1);

        if (lastDate && lastId) {
            lastDate = new admin.firestore.Timestamp(lastDate._seconds, lastDate._nanoseconds);
            const lastDocRef = db.collection('expenses').doc(lastId);
            const lastDocSnap = await lastDocRef.get();
            qry = qry.startAfter(lastDocSnap);
        }

        const snapshot = await qry.get();
        const hasMore = snapshot.size > dataLimit;
        const expenses = [];

        if (snapshot.empty) {
            res.status(404).send('No expenses found');
        } else {
            const sliced = hasMore ? snapshot.docs.slice(0, dataLimit) : snapshot.docs;

            sliced.forEach((doc) => {
                const expense = new Expense(
                    doc.id,
                    doc.data().amount,
                    doc.data().category,
                    doc.data().date
                );
                expenses.push(expense);
            });

            res.status(200).send({ 'expenses': expenses, 'hasMore': hasMore });
        }
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
};

export const getRecentExpenses = async (req, res) => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const snapshot = await db.collection('expenses')
        .where('date', '>=', startDate)
        .where('date', '<', endDate)
        .get();

    res.send(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })));
};

export const updateExpense = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = req.body;
        data.date = data.date ? new Date(data.date) : new Date();

        const expenseRef = db.collection('expenses').doc(id);
        await expenseRef.update(data);

        const updatedDoc = await expenseRef.get();
        res.status(200).send(new Expense(
            updatedDoc.id,
            updatedDoc.data().amount,
            updatedDoc.data().category,
            updatedDoc.data().date
        ));
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const deleteExpense = async (req, res, next) => {
    try {
        const id = req.params.id;
        const expenseRef = db.collection('expenses').doc(id);
        const expense = await expenseRef.get();

        if (!expense.exists) {
            res.status(404).send('Expense not found');
        } else {
            await expenseRef.delete();
            res.status(204).send('Expense deleted successfully');
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};
