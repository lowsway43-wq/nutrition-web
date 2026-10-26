<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
 
public function up(): void
{
    Schema::create('foods', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('category')->nullable();
        $table->decimal('serving_size', 8, 2)->default(100);
        $table->string('serving_unit')->default('gram');
        $table->decimal('calories', 8, 2)->default(0);
        $table->decimal('protein', 8, 2)->default(0);
        $table->decimal('carbohydrates', 8, 2)->default(0);
        $table->decimal('fat', 8, 2)->default(0);
        $table->decimal('sugar', 8, 2)->default(0);
        $table->decimal('sodium', 8, 2)->default(0);
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('food');
    }
};
