/**
 * UTILITY TO FIX INCORRECT PRODUCT NAMES
 * This script helps identify and fix products that have person names instead of actual product names
 */

import { Firestore, collection, getDocs, doc, updateDoc } from '@angular/fire/firestore';

export interface ProductNameIssue {
  productId: string;
  currentName: string;
  sellerId: string;
  sellerName: string;
  category: string;
  price: number;
  stock: number;
}

/**
 * Check if a product name looks like a person's name
 * Returns true if the name has 2+ words with capital letters (likely a person name)
 */
function looksLikePersonName(name: string): boolean {
  if (!name) return false;
  
  const words = name.trim().split(/\s+/);
  
  // If it has exactly 2 words and both start with capital letters, likely a person name
  if (words.length === 2) {
    const bothCapitalized = words.every(word => 
      word.length > 0 && word[0] === word[0].toUpperCase()
    );
    return bothCapitalized;
  }
  
  return false;
}

/**
 * Scan all products and find those with suspicious names
 */
export async function findProductsWithBadNames(firestore: Firestore): Promise<ProductNameIssue[]> {
  const issues: ProductNameIssue[] = [];
  
  try {
    const productsRef = collection(firestore, 'products');
    const snapshot = await getDocs(productsRef);
    
    snapshot.forEach((docSnap) => {
      const product = docSnap.data();
      const productName = product['title'] || '';
      
      // Check if product name looks suspicious
      if (looksLikePersonName(productName)) {
        issues.push({
          productId: docSnap.id,
          currentName: productName,
          sellerId: product['sellerId'] || '',
          sellerName: product['sellerName'] || '',
          category: product['category'] || 'Unknown',
          price: product['price'] || 0,
          stock: product['stock'] || 0
        });
      }
    });
    
    console.log(`Found ${issues.length} products with suspicious names`);
    return issues;
    
  } catch (error) {
    console.error('Error scanning products:', error);
    throw error;
  }
}

/**
 * Update a product's name
 */
export async function updateProductName(
  firestore: Firestore, 
  productId: string, 
  newName: string
): Promise<void> {
  try {
    const productRef = doc(firestore, 'products', productId);
    await updateDoc(productRef, {
      title: newName,
      updatedAt: new Date()
    });
    console.log(`✅ Updated product ${productId} to: ${newName}`);
  } catch (error) {
    console.error(`❌ Failed to update product ${productId}:`, error);
    throw error;
  }
}

/**
 * Main function to list all problematic products
 */
export async function listProblematicProducts(firestore: Firestore): Promise<void> {
  console.log('🔍 Scanning for products with incorrect names...\n');
  
  const issues = await findProductsWithBadNames(firestore);
  
  if (issues.length === 0) {
    console.log('✅ All product names look correct!');
    return;
  }
  
  console.log('❌ Found products that need fixing:\n');
  console.log('═'.repeat(80));
  
  issues.forEach((issue, index) => {
    console.log(`\n${index + 1}. Product ID: ${issue.productId}`);
    console.log(`   Current Name: "${issue.currentName}" (looks like seller name!)`);
    console.log(`   Seller: ${issue.sellerName} (ID: ${issue.sellerId})`);
    console.log(`   Category: ${issue.category}`);
    console.log(`   Price: ₱${issue.price}`);
    console.log(`   Stock: ${issue.stock}`);
    console.log('   ─'.repeat(40));
  });
  
  console.log('\n═'.repeat(80));
  console.log(`\nTotal products to fix: ${issues.length}`);
  console.log('\nTo fix a product, use:');
  console.log('await updateProductName(firestore, "PRODUCT_ID", "Correct Product Name")');
}

/**
 * Batch update products - helps fix multiple products at once
 */
export async function batchUpdateProductNames(
  firestore: Firestore,
  updates: { productId: string; newName: string }[]
): Promise<void> {
  console.log(`📝 Updating ${updates.length} products...`);
  
  const results = {
    success: 0,
    failed: 0
  };
  
  for (const update of updates) {
    try {
      await updateProductName(firestore, update.productId, update.newName);
      results.success++;
    } catch (error) {
      results.failed++;
    }
  }
  
  console.log(`\n✅ Successfully updated: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);
}
